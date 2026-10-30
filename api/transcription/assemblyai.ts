/// <reference types="node" />

import { guardRequest, MAX_BYTES } from '../_lib/guard.js'
import { getAudioFile } from '../_lib/audioForm.js'

export const config = { runtime: 'edge' }

type AssemblyTranscript = {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  text?: string | null
  error?: string | null
  language_code?: string
  audio_duration?: number | null
}

const POLL_INTERVAL_MS = 1000
const MAX_POLL_ATTEMPTS = 20

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return Response.json(
      { error: { code: 'method_not_allowed', message: 'POST only.' } },
      { status: 405 },
    )
  }

  const blocked = await guardRequest(request)
  if (blocked) return blocked

  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) {
    return Response.json(
      {
        error: {
          code: 'not_configured',
          message: 'AssemblyAI transcription is not configured.',
        },
      },
      { status: 501 },
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json(
      {
        error: {
          code: 'bad_request',
          message: 'Expected multipart form data.',
        },
      },
      { status: 400 },
    )
  }

  const file = getAudioFile(form)
  const language = String(form.get('language') ?? 'en')

  if (!file) {
    return Response.json(
      { error: { code: 'bad_request', message: 'Missing audio file.' } },
      { status: 400 },
    )
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: { code: 'too_large', message: 'Audio file is too large.' } },
      { status: 413 },
    )
  }

  const uploadResponse = await fetch(
    'https://api.assemblyai.com/v2/upload',
    {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': file.type || 'application/octet-stream',
      },
      body: file,
    },
  )

  if (!uploadResponse.ok) {
    return Response.json(
      {
        error: {
          code: 'provider_error',
          message: 'AssemblyAI upload failed.',
        },
      },
      { status: uploadResponse.status },
    )
  }

  const { upload_url: uploadUrl } = (await uploadResponse.json()) as {
    upload_url: string
  }

  const createResponse = await fetch(
    'https://api.assemblyai.com/v2/transcript',
    {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        language_code: language,
      }),
    },
  )

  if (!createResponse.ok) {
    return Response.json(
      {
        error: {
          code: 'provider_error',
          message: 'AssemblyAI could not start transcription.',
        },
      },
      { status: createResponse.status },
    )
  }

  const created = (await createResponse.json()) as AssemblyTranscript

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    const pollResponse = await fetch(
      `https://api.assemblyai.com/v2/transcript/${created.id}`,
      { headers: { authorization: apiKey } },
    )

    if (!pollResponse.ok) {
      return Response.json(
        {
          error: {
            code: 'provider_error',
            message: 'AssemblyAI polling failed.',
          },
        },
        { status: pollResponse.status },
      )
    }

    const transcript = (await pollResponse.json()) as AssemblyTranscript

    if (transcript.status === 'error') {
      return Response.json(
        {
          error: {
            code: 'provider_error',
            message: transcript.error ?? 'AssemblyAI transcription failed.',
          },
        },
        { status: 502 },
      )
    }

    if (transcript.status === 'completed') {
      const text = transcript.text?.trim() ?? ''
      const durationMs = Math.round(
        (transcript.audio_duration ?? 0) * 1000,
      )

      return Response.json({
        language: transcript.language_code ?? language,
        segments: text
          ? [{ text, startMs: 0, endMs: durationMs }]
          : [],
      })
    }
  }

  return Response.json(
    {
      error: {
        code: 'timeout',
        message: 'AssemblyAI transcription timed out.',
      },
    },
    { status: 504 },
  )
}
