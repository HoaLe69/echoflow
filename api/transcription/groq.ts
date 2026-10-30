/// <reference types="node" />

import { guardRequest, MAX_BYTES } from '../_lib/guard.js'
import {
  getAudioFile,
  getAudioFileName,
} from '../_lib/audioForm.js'

export const config = { runtime: 'edge' }

type GroqResponse = {
  text?: string
  language?: string
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return Response.json(
      { error: { code: 'method_not_allowed', message: 'POST only.' } },
      { status: 405 },
    )
  }

  const blocked = await guardRequest(request)
  if (blocked) return blocked

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json(
      {
        error: {
          code: 'not_configured',
          message: 'Groq transcription is not configured.',
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

  const upstreamForm = new FormData()
  upstreamForm.append('file', file, getAudioFileName(file))
  upstreamForm.append('model', 'whisper-large-v3-turbo')
  upstreamForm.append('response_format', 'verbose_json')
  upstreamForm.append('language', language)

  const response = await fetch(
    'https://api.groq.com/openai/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    return Response.json(
      {
        error: {
          code: response.status === 429 ? 'rate_limit' : 'provider_error',
          message: detail || 'Groq transcription failed.',
        },
      },
      { status: response.status },
    )
  }

  const data = (await response.json()) as GroqResponse
  const segments = data.segments?.length
    ? data.segments.map((segment) => ({
      text: segment.text.trim(),
      startMs: Math.round(segment.start * 1000),
      endMs: Math.round(segment.end * 1000),
    }))
    : data.text
      ? [{ text: data.text.trim(), startMs: 0, endMs: 0 }]
      : []

  return Response.json({
    language: data.language ?? language,
    segments,
  })
}
