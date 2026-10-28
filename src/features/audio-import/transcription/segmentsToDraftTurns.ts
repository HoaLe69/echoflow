import type { DraftTurn } from "../types";
import type { RawTranscriptSegment } from "../../transcription/types";

/**
 * Whisper does not provide diarization. Alternate A/B as an initial guess
 * the review screen lets the user correct it.
 */

export function segmentsToDraftTurns(
  segments: RawTranscriptSegment[],
): DraftTurn[] {
  return segments.filter((segment) => segment.text.trim().length > 0)
    .map((segment, index) => ({
      id: crypto.randomUUID(),
      startMs: segment.startMs,
      endMs: segment.endMs,
      text: segment.text.trim(),
      speaker: index % 2 === 0 ? 'A' : 'B'
    }))
}
