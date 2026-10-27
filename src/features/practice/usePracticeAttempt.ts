import { useCallback, useEffect, useRef, useState } from 'react'
import { useProgress } from '../../hooks/useProgress'
import { useRecognition } from '../../hooks/useRecognition'
import { scorePronunciation } from '../../lib/score'
import type { ScoreResult } from '../../lib/score'
import type { TurnAudio } from '../../types/scenario'
import { usePracticeAudio } from './audio/usePracticeAudio'

type PracticeAttemptParams = {
	scenarioId: string
	turnKey: string
	cue: string | null
	target: string
	rate: number
	isActive: boolean
	audioSourceId?: string
	cueAudio?: TurnAudio
	targetAudio?: TurnAudio
}

export function usePracticeAttempt({
	scenarioId,
	turnKey,
	cue,
	target,
	rate,
	isActive,
	audioSourceId,
	cueAudio,
	targetAudio,
}: PracticeAttemptParams) {
	const { recordAttempt } = useProgress()
	const {
		start: startRecognition,
		stop: stopRecognition,
		reset: resetRecognition,
		isListening,
		isSupported,
		transcript,
		error,
	} = useRecognition({ lang: 'en-US' })

	const audio = usePracticeAudio({
		sourceId: audioSourceId,
		cueAudio,
		targetAudio,
		cueText: cue,
		targetText: target,
		rate,
	})

	const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
	const lastScored = useRef<string | null>(null)
	const playCueRef = useRef(audio.playCue)
	const stopAudioRef = useRef(audio.stop)

	useEffect(() => {
		playCueRef.current = audio.playCue
		stopAudioRef.current = audio.stop
	}, [audio.playCue, audio.stop])

	const resetAttempt = useCallback(() => {
		audio.stop()
		resetRecognition()
		lastScored.current = null
		setScoreResult(null)
	}, [audio, resetRecognition])

	// New turn/role/round: auto-play the cue from native audio or TTS.
	useEffect(() => {
		if (!isActive || !cue) return
		if (audio.isNative && !audio.clipReady) return

		playCueRef.current()
		return () => stopAudioRef.current()
	}, [turnKey, cue, isActive, audio.isNative, audio.clipReady])

	// Score once per completed transcript.
	useEffect(() => {
		if (isListening) return

		const spoken = transcript.trim()
		if (!spoken || spoken === lastScored.current) return

		lastScored.current = spoken
		const result = scorePronunciation(target, spoken)
		setScoreResult(result)
		recordAttempt(scenarioId, { fluencyScore: result.score })
	}, [isListening, transcript, target, scenarioId, recordAttempt])

	const toggleRecording = () => {
		if (!isSupported || !isActive) return

		if (isListening) {
			stopRecognition()
			return
		}

		audio.stop()
		lastScored.current = null
		setScoreResult(null)
		startRecognition()
	}

	return {
		scoreResult,
		isListening,
		isSupported,
		error,
		audioError: audio.clipError,
		toggleRecording,
		resetAttempt,
		playPartner: audio.playCue,
		playReference: audio.playReference,
		playBreakdown: audio.playBreakdown,
	}
}
