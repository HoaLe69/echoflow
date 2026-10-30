import { useEffect } from 'react'
import Icon from '../../components/Icon'
import type { DropboxSyncController } from './useDropboxSync'

type SyncDialogProps = {
  sync: DropboxSyncController
}

function formatSyncTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export default function SyncDialog({ sync }: SyncDialogProps) {
  const { isOpen, isBusy, close } = sync

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) close()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [close, isBusy, isOpen])

  if (!isOpen) return null

  const statusCopy =
    sync.status === 'connecting'
      ? 'Connecting to Dropbox…'
      : sync.status === 'backing-up'
        ? 'Backing up your library…'
        : sync.status === 'restoring'
          ? 'Restoring your library…'
          : null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-matcha-forest/30 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isBusy) close()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dropbox-sync-title"
        aria-describedby="dropbox-sync-description"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-primary/15 bg-surface-container-lowest p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-matcha-foam text-lg text-primary"
            >
              <Icon name="cloud_sync" className="text-xl" />
            </div>
            <h2
              id="dropbox-sync-title"
              className="font-headline text-lg font-bold text-matcha-forest"
            >
              Dropbox sync
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={isBusy}
            aria-label="Close dialog"
            className="focus-ring rounded-full p-1 text-matcha-sage transition-colors hover:bg-surface-container-low hover:text-matcha-forest disabled:opacity-40"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <p
          id="dropbox-sync-description"
          className="mt-2 text-xs leading-relaxed text-matcha-sage"
        >
          Back up your imported conversations, free talks, audio, and progress
          to Dropbox. Restore them on another browser.
        </p>

        {!sync.isConfigured ? (
          <div className="mt-4 rounded-2xl border border-primary/10 bg-surface-container-low p-4">
            <p className="text-xs font-bold text-matcha-forest">
              Dropbox is not configured
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-matcha-sage">
              Add <code>VITE_DROPBOX_APP_KEY</code> to your environment, enable
              the file content scopes in the Dropbox app, and register this
              site&apos;s root URL as a redirect URI.
            </p>
          </div>
        ) : !sync.isConnected ? (
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-2xl border border-primary/10 bg-surface-container-low p-4">
              <p className="text-xs leading-relaxed text-matcha-sage">
                EchoFlow creates an app folder in Dropbox. It cannot access the
                rest of your Dropbox files.
              </p>
            </div>
            <button
              type="button"
              onClick={sync.connect}
              disabled={isBusy}
              className="focus-ring flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95 disabled:opacity-50"
            >
              <Icon name="link" className="text-base" />
              Connect Dropbox
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-surface-container-low p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-matcha-forest">
                  {sync.account?.name ?? 'Dropbox connected'}
                </p>
                <p className="truncate text-[10px] text-matcha-sage">
                  {sync.account?.email ?? 'App folder access'}
                </p>
              </div>
              <span className="rounded-full bg-matcha-foam px-2 py-1 text-[10px] font-bold text-primary">
                Connected
              </span>
            </div>

            {sync.lastSync ? (
              <p className="text-[11px] text-outline">
                Last {sync.lastSync.direction}:{' '}
                {formatSyncTime(sync.lastSync.at)}
              </p>
            ) : (
              <p className="text-[11px] text-outline">
                No sync has run on this browser yet.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void sync.backup()}
                disabled={isBusy}
                className="focus-ring flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-95 disabled:opacity-50"
              >
                <Icon name="cloud_upload" className="text-base" />
                Back up now
              </button>
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    'Restore will replace all imported conversations, free talks, audio, and progress on this browser. Continue?',
                  )
                  if (confirmed) void sync.restore()
                }}
                disabled={isBusy}
                className="focus-ring flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-surface-container-low px-5 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-matcha-foam disabled:opacity-50"
              >
                <Icon name="cloud_download" className="text-base" />
                Restore from Dropbox
              </button>
            </div>

            <p className="text-[10px] leading-relaxed text-outline">
              Restore downloads the latest data.json and audio files into this
              browser&apos;s local library.
            </p>

            <button
              type="button"
              onClick={sync.disconnect}
              disabled={isBusy}
              className="focus-ring self-start rounded-full px-2 py-1 text-[11px] font-semibold text-matcha-sage transition-colors hover:text-error disabled:opacity-40"
            >
              Disconnect Dropbox
            </button>
          </div>
        )}

        {statusCopy ? (
          <div className="mt-4 rounded-2xl border border-primary/10 bg-surface-container-low p-3">
            <p className="text-xs font-semibold text-primary">{statusCopy}</p>
            {sync.progress ? (
              <>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${
                        sync.progress.total > 0
                          ? Math.round(
                              (sync.progress.current /
                                sync.progress.total) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-outline">
                  {sync.progress.message}
                </p>
              </>
            ) : null}
          </div>
        ) : null}

        {sync.status === 'success' ? (
          <p
            role="status"
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <Icon name="check_circle" className="text-base" />
            {sync.lastSync?.direction === 'restore'
              ? 'Restore complete. Reloading…'
              : 'Backup complete.'}
          </p>
        ) : null}

        {sync.error ? (
          <p role="alert" className="mt-3 text-xs font-medium text-error">
            {sync.error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
