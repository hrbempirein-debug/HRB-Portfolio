/**
 * Vercel host adapter for the HRB portfolio assistant.
 *
 * Thin glue only: imports the existing `createAssistantHandler` (the single
 * source of truth for validation, grounding, retrieval, provider selection,
 * bounded retry, graceful fallback, error sanitization, /Confirm:* cleanup,
 * and rate limiting) and exposes it through Vercel's Node-compatible
 * request/response interface as `POST /api/assistant`.
 *
 * No business logic lives here. `server/index.ts` (createServer/listen) is
 * intentionally NOT imported — Vercel provides the HTTP server.
 */
import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAssistantHandler } from '../server/handler.ts'

/**
 * Resolve the deployed project root (the folder containing `knowledge/`).
 * Prefers the module-relative location when running from the repo (`api/`);
 * falls back to the process working directory because Vercel executes its
 * Node functions from the project root. Never hard-codes a machine path.
 */
function resolveProjectRoot(): string {
  const candidates = [
    resolve(fileURLToPath(new URL('../', import.meta.url))),
    process.cwd(),
  ]
  return candidates.find((dir) => existsSync(join(dir, 'knowledge'))) ?? candidates[0]
}

const assistant = createAssistantHandler({ rootDir: resolveProjectRoot() })

/**
 * Vercel Node Function default export.
 *
 * Vercel hands this a Node-compatible `IncomingMessage`/`ServerResponse`.
 * Non-POST requests take the handler's existing 404 path (no `next` is
 * passed), which preserves the verified POST-only behavior. The function
 * stays alive until the response finishes so asynchronous provider calls
 * complete before Vercel considers the request handled.
 */
export default async function hrbAssistantHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await new Promise<void>((resolveDone) => {
    assistant(req, res)
    res.once('finish', resolveDone)
    res.once('close', resolveDone)
  })
}