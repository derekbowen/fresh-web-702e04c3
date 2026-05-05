import * as React from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/unsubscribe')({
  validateSearch: searchSchema,
  component: UnsubscribePage,
  head: () => ({
    meta: [
      { title: 'Unsubscribe — Pool Rental Near Me' },
      { name: 'robots', content: 'noindex,nofollow' },
    ],
  }),
})

type Status =
  | 'validating'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'already'
  | 'invalid'
  | 'error'

function UnsubscribePage() {
  const { token } = useSearch({ from: '/unsubscribe' })
  const [status, setStatus] = React.useState<Status>('validating')

  React.useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    let cancelled = false
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (cancelled) return
        if (!r.ok) {
          setStatus('invalid')
          return
        }
        if (body.valid) setStatus('ready')
        else if (body.reason === 'already_unsubscribed') setStatus('already')
        else setStatus('invalid')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [token])

  async function confirm() {
    if (!token) return
    setStatus('submitting')
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) {
        setStatus('error')
        return
      }
      if (body.success) setStatus('success')
      else if (body.reason === 'already_unsubscribed') setStatus('already')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>

        {status === 'validating' && (
          <p className="mt-4 text-muted-foreground">Checking your link…</p>
        )}

        {status === 'ready' && (
          <>
            <p className="mt-4 text-muted-foreground">
              Click below to stop receiving emails from Pool Rental Near Me.
            </p>
            <button
              onClick={confirm}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow hover:bg-primary/90"
            >
              Confirm unsubscribe
            </button>
          </>
        )}

        {status === 'submitting' && (
          <p className="mt-4 text-muted-foreground">Processing…</p>
        )}

        {status === 'success' && (
          <p className="mt-4 text-foreground">
            You've been unsubscribed. We won't email you again.
          </p>
        )}

        {status === 'already' && (
          <p className="mt-4 text-foreground">
            You're already unsubscribed. No further action needed.
          </p>
        )}

        {status === 'invalid' && (
          <p className="mt-4 text-destructive">
            This unsubscribe link is invalid or expired.
          </p>
        )}

        {status === 'error' && (
          <p className="mt-4 text-destructive">
            Something went wrong. Please try the link again or contact support.
          </p>
        )}
      </div>
    </div>
  )
}
