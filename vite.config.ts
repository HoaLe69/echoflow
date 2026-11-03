import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

/**
 * Local Whisper needs crossOriginIsolated, but a COEP: require-corp document
 * cannot embed YouTube's iframe (YouTube does not send COEP on the embed
 * document). Keep isolation only on the pages that transcribe audio and leave
 * the notebook pages unisolated.
 */
const ISOLATED_PATH = /^\/(import|speak)(\/|$)/

function crossOriginIsolationHeaders(): Plugin {
  const middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const pathname = (req.url ?? '/').split('?')[0]
    const isolated = ISOLATED_PATH.test(pathname)

    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    res.setHeader(
      'Cross-Origin-Embedder-Policy',
      isolated ? 'require-corp' : 'unsafe-none',
    )
    next()
  }

  return {
    name: 'echoflow-cross-origin-isolation',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crossOriginIsolationHeaders()],
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
})
