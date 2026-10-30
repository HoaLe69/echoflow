import { useCallback, useEffect, useState } from 'react'
import {
  consumeDropboxAuthCallback,
  disconnectDropbox,
  DropboxAuthError,
  getStoredAuth,
  isDropboxConfigured,
  startDropboxAuth,
} from './auth'
import { getDropboxAccount } from './client'
import {
  backupToDropbox,
  readLastSync,
  restoreFromDropbox,
} from './sync'
import type {
  DropboxAccount,
  DropboxLastSync,
  SyncProgress,
} from './types'

export type DropboxSyncStatus =
  | 'idle'
  | 'connecting'
  | 'backing-up'
  | 'restoring'
  | 'success'
  | 'error'

export type DropboxSyncController = {
  isConfigured: boolean
  isConnected: boolean
  isOpen: boolean
  isBusy: boolean
  status: DropboxSyncStatus
  error: string | null
  progress: SyncProgress | null
  account: DropboxAccount | null
  lastSync: DropboxLastSync | null
  open: () => void
  close: () => void
  connect: () => void
  disconnect: () => void
  backup: () => Promise<void>
  restore: () => Promise<void>
}

function errorText(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Dropbox sync failed.'
}

export function useDropboxSync(): DropboxSyncController {
  const configured = isDropboxConfigured()
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(
    () => Boolean(getStoredAuth()),
  )
  const [account, setAccount] = useState<DropboxAccount | null>(
    () => getStoredAuth()?.account ?? null,
  )
  const [status, setStatus] = useState<DropboxSyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [lastSync, setLastSync] = useState<DropboxLastSync | null>(
    readLastSync,
  )

  const isBusy =
    status === 'connecting' ||
    status === 'backing-up' ||
    status === 'restoring'

  useEffect(() => {
    if (!configured) return

    let cancelled = false

    const finishAuth = async () => {
      try {
        const auth = await consumeDropboxAuthCallback()
        if (!auth || cancelled) return

        setIsConnected(true)
        setStatus('idle')
        setIsOpen(true)

        try {
          const nextAccount = await getDropboxAccount()
          if (!cancelled) setAccount(nextAccount)
        } catch {
          // Authorization succeeded; account info is non-critical.
        }
      } catch (authError) {
        if (cancelled) return
        setError(errorText(authError))
        setStatus('error')
        setIsOpen(true)
      }
    }

    void finishAuth()
    return () => {
      cancelled = true
    }
  }, [configured])

  const loadAccount = useCallback(async () => {
    if (!getStoredAuth()) return

    try {
      const nextAccount = await getDropboxAccount()
      setAccount(nextAccount)
      setIsConnected(true)
    } catch (accountError) {
      setError(errorText(accountError))
      if (
        accountError instanceof DropboxAuthError &&
        (accountError.code === 'not_connected' ||
          accountError.code === 'refresh_failed')
      ) {
        disconnectDropbox()
        setIsConnected(false)
        setAccount(null)
      }
    }
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
    setError(null)
    if (getStoredAuth() && !account) {
      void loadAccount()
    }
  }, [account, loadAccount])

  const close = useCallback(() => {
    if (isBusy) return
    setIsOpen(false)
  }, [isBusy])

  const connect = useCallback(() => {
    if (!configured) {
      setError(
        'Dropbox sync is not configured. Add VITE_DROPBOX_APP_KEY.',
      )
      return
    }

    setError(null)
    setStatus('connecting')
    void startDropboxAuth().catch((authError) => {
      setError(errorText(authError))
      setStatus('error')
    })
  }, [configured])

  const disconnect = useCallback(() => {
    disconnectDropbox()
    setIsConnected(false)
    setAccount(null)
    setStatus('idle')
    setError(null)
    setProgress(null)
    setIsOpen(false)
  }, [])

  const backup = useCallback(async () => {
    if (isBusy) return

    setStatus('backing-up')
    setError(null)
    setProgress(null)

    try {
      const result = await backupToDropbox(setProgress)
      setLastSync(result)
      setStatus('success')
    } catch (backupError) {
      setError(errorText(backupError))
      setStatus('error')
      setProgress(null)
      if (
        backupError instanceof DropboxAuthError &&
        (backupError.code === 'not_connected' ||
          backupError.code === 'refresh_failed')
      ) {
        setIsConnected(false)
        setAccount(null)
      }
    }
  }, [isBusy])

  const restore = useCallback(async () => {
    if (isBusy) return

    setStatus('restoring')
    setError(null)
    setProgress(null)

    try {
      const result = await restoreFromDropbox(setProgress)
      setLastSync(result)
      setStatus('success')
      // Reload so useProgress and the scenario catalog pick up restored data.
      window.setTimeout(() => window.location.reload(), 600)
    } catch (restoreError) {
      setError(errorText(restoreError))
      setStatus('error')
      setProgress(null)
      if (
        restoreError instanceof DropboxAuthError &&
        (restoreError.code === 'not_connected' ||
          restoreError.code === 'refresh_failed')
      ) {
        setIsConnected(false)
        setAccount(null)
      }
    }
  }, [isBusy])

  return {
    isConfigured: configured,
    isConnected,
    isOpen,
    isBusy,
    status,
    error,
    progress,
    account,
    lastSync,
    open,
    close,
    connect,
    disconnect,
    backup,
    restore,
  }
}
