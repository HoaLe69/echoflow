import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Icon from '../../components/Icon'
import {
  createYouTubeBackup,
  downloadYouTubeBackup,
  importYouTubeBackup,
} from './lib/exportImport'
import type { BackupIssue } from './lib/exportImport'

type BackupPanelProps = {
  onChanged: () => void
}

type ImportSummary = {
  videosImported: number
  notesImported: number
  videosSkipped: number
  notesSkipped: number
  issues: BackupIssue[]
}

export default function BackupPanel({ onChanged }: BackupPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsWorking(true)
    setError(null)
    setSummary(null)

    try {
      const backup = await createYouTubeBackup()
      downloadYouTubeBackup(backup)
      setMessage(
        `Exported ${backup.videos.length} ${
          backup.videos.length === 1 ? 'video' : 'videos'
        } and ${backup.notes.length} ${
          backup.notes.length === 1 ? 'note' : 'notes'
        }.`,
      )
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : 'Could not export your notebook.',
      )
    } finally {
      setIsWorking(false)
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsWorking(true)
    setError(null)
    setSummary(null)
    setMessage(null)

    try {
      const parsed: unknown = JSON.parse(await file.text())
      const result = await importYouTubeBackup(parsed)

      setSummary({
        videosImported: result.videosImported,
        notesImported: result.notesImported,
        videosSkipped: result.videosSkipped,
        notesSkipped: result.notesSkipped,
        issues: result.issues,
      })
      setMessage(
        `Merged ${result.videosImported} ${
          result.videosImported === 1 ? 'video' : 'videos'
        } and ${result.notesImported} ${
          result.notesImported === 1 ? 'note' : 'notes'
        }.`,
      )
      onChanged()
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'Could not import this backup.',
      )
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <section className="rounded-3xl border border-primary/10 bg-surface-container-lowest p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-headline text-lg font-bold text-matcha-forest">
            Backup your notebook
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-matcha-sage">
            Export a JSON file with every video and note, or merge one back in.
            Newer <code>updatedAt</code> records win; invalid rows are reported
            and skipped.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isWorking}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95 disabled:opacity-50"
          >
            <Icon name="download" className="text-base" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isWorking}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-surface-container-low px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-matcha-foam disabled:opacity-50"
          >
            <Icon name="upload" className="text-base" />
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImportFile(event)}
            className="sr-only"
            aria-label="Choose a YouTube notebook backup file"
          />
        </div>
      </div>

      {message ? (
        <p
          role="status"
          className="mt-3 rounded-xl bg-matcha-foam px-3 py-2 text-xs font-semibold text-primary"
        >
          {message}
        </p>
      ) : null}

      {summary ? (
        <div className="mt-2 text-[11px] leading-relaxed text-matcha-sage">
          <p>
            {summary.videosSkipped} older video
            {summary.videosSkipped === 1 ? '' : 's'} and{' '}
            {summary.notesSkipped} older note
            {summary.notesSkipped === 1 ? '' : 's'} kept locally.
          </p>
          {summary.issues.length > 0 ? (
            <details className="mt-2 rounded-xl border border-primary/10 bg-surface-container-low p-3">
              <summary className="cursor-pointer font-bold text-matcha-forest">
                {summary.issues.length} invalid record
                {summary.issues.length === 1 ? '' : 's'} skipped
              </summary>
              <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-4">
                {summary.issues.map((issue) => (
                  <li key={`${issue.collection}-${issue.index}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-error-container/60 px-3 py-2 text-xs font-semibold text-on-error-container"
        >
          {error}
        </p>
      ) : null}
    </section>
  )
}
