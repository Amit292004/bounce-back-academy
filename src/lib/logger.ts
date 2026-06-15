/**
 * Server-safe logger.
 *
 * Next.js dev mode intercepts `console.error` on the server and surfaces
 * every call as the red error overlay in the browser — even when the error
 * is safely caught in a try/catch.  Using `process.stdout.write` bypasses
 * that interception so errors appear only in the terminal, not the overlay.
 *
 * Usage:  import { logger } from '@/lib/logger'
 *         logger.error('Something went wrong', error)
 */

const isDev = process.env.NODE_ENV !== 'production'

function formatArg(value: unknown): string {
  if (value instanceof Error) return value.message
  if (typeof value === 'string') return value
  return String(value)
}

function format(level: string, msg: unknown, extra?: unknown): string {
  const timestamp = new Date().toISOString().slice(11, 19) // HH:MM:SS
  const extraStr =
    extra !== undefined ? ` — ${formatArg(extra)}` : ''
  return `[${timestamp}] [${level}] ${formatArg(msg)}${extraStr}\n`
}

export const logger = {
  error(msg: unknown, extra?: unknown) {
    process.stdout.write(format('ERROR', msg, extra))
  },
  warn(msg: unknown, extra?: unknown) {
    if (isDev) process.stdout.write(format('WARN ', msg, extra))
  },
  info(msg: unknown, extra?: unknown) {
    if (isDev) process.stdout.write(format('INFO ', msg, extra))
  },
}
