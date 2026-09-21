/**
 * Production server for the HRB portfolio + the AI assistant API.
 *
 *   node server/index.ts
 *
 * Runs the TypeScript source directly via Node's native type stripping (Node
 * 23.6+ / any modern runtime). Serves the built static site from `dist/` and
 * exposes `POST /api/assistant`. Knowledge stays server-side; the AI provider
 * key lives only in server-side environment variables (or `.env`, loaded only
 * here).
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import type { ServerResponse } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './env.ts'
import { createAssistantHandler } from './handler.ts'

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)))
loadEnvFile(ROOT)

const DIST = join(ROOT, 'dist')
const PORT = Number(process.env.PORT ?? 4173)
const HOST = process.env.HOST ?? '0.0.0.0'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

function sendText(res: ServerResponse, status: number, body: string, type = 'text/plain'): void {
  res.writeHead(status, {
    'content-type': `${type}; charset=utf-8`,
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

/** Resolve a request path to a file inside `DIST`, rejecting traversal. */
function resolveAsset(pathname: string): string | null {
  const decoded = (() => {
    try {
      return decodeURIComponent(pathname)
    } catch {
      return null
    }
  })()
  if (!decoded) return null
  if (decoded.includes('\0')) return null

  const target = normalize(join(DIST, decoded.replace(/^\/+/, '')))
  const rootPrefix = DIST.endsWith(sep) ? DIST : `${DIST}${sep}`
  if (!target.startsWith(rootPrefix)) return null
  return target
}

async function serveStatic(res: ServerResponse, pathname: string): Promise<void> {
  const requested = pathname === '/' ? '/index.html' : pathname
  const asset = resolveAsset(requested)
  if (!asset) {
    sendText(res, 403, 'Forbidden')
    return
  }

  try {
    const stats = statSync(asset)
    if (stats.isDirectory()) {
      return serveStatic(res, `${pathname.replace(/\/$/, '')}/index.html`)
    }
  } catch {
    sendText(res, 404, 'Not found')
    return
  }

  const type = MIME[extname(asset).toLowerCase()] ?? 'application/octet-stream'
  const stream = createReadStream(asset)
  res.writeHead(200, {
    'content-type': type,
    'content-length': statSync(asset).size,
    'cache-control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  await new Promise<void>((resolveStream) => {
    stream.pipe(res)
    stream.on('end', resolveStream)
    stream.on('error', () => {
      try {
        res.end()
      } catch {
        /* already closed */
      }
      resolveStream()
    })
  })
}

const assistant = createAssistantHandler({ rootDir: ROOT })

const server = createServer((req, res) => {
  const pathname = (req.url ?? '/').split('?')[0] || '/'

  if (pathname.startsWith('/api/')) {
    void assistant(req, res)
    return
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    void serveStatic(res, pathname).catch(() => {
      try {
        sendText(res, 500, 'Server error')
      } catch {
        /* already closed */
      }
    })
    return
  }

  sendText(res, 405, 'Method not allowed')
})

server.listen(PORT, HOST, () => {
  console.log(`HRB portfolio server → http://${HOST}:${PORT}`)
  if (!existsSync(join(DIST, 'index.html'))) {
    console.warn(`Warning: ${DIST} has no index.html — run "npm run build" first.`)
  }
  if (!process.env.PORTFOLIO_AI_API_KEY) {
    console.warn(
      '[assistant] PORTFOLIO_AI_API_KEY is not set — assistant will reply with an offline message.',
    )
  } else {
    console.log(
      `[assistant] provider=${process.env.PORTFOLIO_AI_PROVIDER ?? 'openai-compatible'} model=${process.env.PORTFOLIO_AI_MODEL ?? '(default)'}`,
    )
  }
})

export { ROOT }