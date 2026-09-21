/**
 * Vite plugin — exposes the assistant API on the dev server.
 *
 * Development: `POST /api/assistant` is handled in-process by the same server
 * modules used by the production server (`server/`). Production: serve the
 * built site with `node server/index.ts` (see `server/index.ts`).
 *
 * The plugin is dev-only (`configureServer`) and never ships to the client.
 */
import type { Plugin } from 'vite'
import { loadEnvFile } from '../server/env.ts'
import { createAssistantHandler } from '../server/handler.ts'

export function assistantServer(): Plugin {
  let handler: ReturnType<typeof createAssistantHandler> | null = null

  return {
    name: 'hrb-assistant-server',

    configureServer(server) {
      loadEnvFile(server.config.root)
      handler = createAssistantHandler({ rootDir: server.config.root })

      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          void handler?.(req, res, next)
          return
        }
        next()
      })

      server.config.logger.info('[assistant] dev API mounted at POST /api/assistant')
    },

    configurePreviewServer() {
      // `vite preview` intentionally has no AI endpoint — use the persistent
      // server (`npm run serve`) so the API is available where it matters.
    },
  }
}