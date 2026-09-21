/** Server-side environment loading — zero-dependency `.env` reader. */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Load `KEY=VALUE` pairs from `rootDir/<filename>` into `process.env` but
 * never override variables that are already set (real environment wins).
 * Support is limited to the simple format used for deployment secrets.
 */
export function loadEnvFile(rootDir: string, filename = '.env'): void {
  const file = join(rootDir, filename)
  if (!existsSync(file)) return

  const text = readFileSync(file, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const equals = line.indexOf('=')
    if (equals === -1) continue

    const key = line.slice(0, equals).trim()
    let value = line.slice(equals + 1).trim()
    if (!key) continue
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}