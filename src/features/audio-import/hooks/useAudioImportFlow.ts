import { useCallback, useState } from "react";
import { saveImportBundle } from "../../../data/audioRepository";
import {
  draftToImportedScenario,
  mergeDraftTurn,
  splitDraftTurn,
  updateDraftTurn,
  validateDraftTurns
} from '../lib/draftTurns'

import { inspectAudioFile } from "../lib/validateAudioFile";
import { segmentsToDraftTurns } from "../transcription/segmentsToDraftTurns";
import type {
  AudioSourceRecord,
  DraftTurn,
  ImportFormValues,
  ImportStep,
  SpeakerLabel
} from '../types'

import { useTranscriber } from "./useTranscriber";

export function useAudioImportFlow() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const [turns, setTurns] = useState<DraftTurn[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const transcriber = useTranscriber()

  const chooseFile = useCallback(async (nextFile: File) => {
    setFileError(null)

    try {
      const info = await inspectAudioFile(nextFile)
      setFile(nextFile)
      setDurationMs(info.durationMs)
      setTurns([])
      setStep('transcribe')
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : 'Could not read the audio files.'
      )
    }

  }, [])

  const transcribe = useCallback(async () => {
    if (!file) return
    try {
      const result = await transcriber.transcribe(file)
      if (result.segments.length === 0) {
        setFileError('No speech was detected in this file.')
        return
      }
      setTurns(segmentsToDraftTurns(result.segments))
      setStep('review')
    } catch {
      // useTranscriber exposes the error for the UI.
    }
  }, [file, transcriber])
  const updateTurn = useCallback((id: string, patch: { text?: string; speaker?: SpeakerLabel }) => {
    setTurns((current) => updateDraftTurn(current, id, patch))
  }, [])
  const mergeTurn = useCallback((index: number) => {
    setTurns((current) => mergeDraftTurn(current, index))
  }, [])

  const splitTurn = useCallback((index: number) => {
    setTurns((current) => splitDraftTurn(current, index))
  }, [])

  const save = useCallback(
    async (form: ImportFormValues): Promise<string | null> => {
      if (!file) return null

      const validationError = validateDraftTurns(turns)
      if (validationError) {
        setSaveError(validationError)
        return null
      }

      setSaveError(null)
      setIsSaving(true)

      try {
        const sourceId = crypto.randomUUID()
        const scenarioId = `imported-${crypto.randomUUID()}`
        const source: AudioSourceRecord = {
          id: sourceId,
          fileName: file.name,
          mimeType: file.type || 'audio/mpeg',
          sizeBytes: file.size,
          durationMs,
          blob: file,
          createdAt: Date.now(),
        }
        const scenario = draftToImportedScenario({
          id: scenarioId,
          sourceId,
          turns,
          form,
        })

        await saveImportBundle(source, scenario)
        return scenarioId
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : 'Could not save this audio scenario.',
        )
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [durationMs, file, turns],
  )
  const reset = useCallback(() => {
    setStep('upload')
    setFile(null)
    setDurationMs(0)
    setTurns([])
    setFileError(null)
    setSaveError(null)
  }, [])

  return {
    step,
    file,
    durationMs,
    turns,
    fileError,
    saveError,
    isSaving,
    transcriber,
    chooseFile,
    transcribe,
    updateTurn,
    mergeTurn,
    splitTurn,
    save,
    reset,
  }
}
