// Public, unauthenticated page — linked as the "Delete account URL" in Google Play
// Console (Data safety). Keep this route OUTSIDE <ProtectedLayout> in App.tsx.
//
// Flow (phone-login users): send-otp -> verify-otp -> DELETE /users/me, using the
// same public endpoints the mobile app uses. Google-login users use the email option.

import { useState } from 'react'
import { API_BASE_URL } from '@/lib/env'

type Msg = { text: string; kind: 'err' | 'ok' | 'info' } | null

function toCanonicalIndianPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null
}

async function call<T = unknown>(
  path: string,
  method: 'POST' | 'DELETE',
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let json: { message?: string } = {}
  try {
    json = await res.json()
  } catch {
    // non-JSON error body
  }
  if (!res.ok) throw new Error(json.message ?? 'Something went wrong. Please try again.')
  return json as T
}

type VerifyResponse = { data?: { accessToken?: string; isNewUser?: boolean } }

export function DeleteAccount() {
  const [phoneInput, setPhoneInput] = useState('')
  const [phone, setPhone] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  async function sendOtp() {
    const p = toCanonicalIndianPhone(phoneInput)
    if (!p) return setMsg({ text: 'Enter a valid 10-digit Indian mobile number.', kind: 'err' })
    setBusy(true)
    setMsg({ text: 'Sending OTP...', kind: 'info' })
    try {
      await call('/auth/send-otp', 'POST', { phone: p })
      setPhone(p)
      setMsg({ text: 'OTP sent to your WhatsApp. Enter it below.', kind: 'ok' })
    } catch (e) {
      setMsg({ text: (e as Error).message, kind: 'err' })
    } finally {
      setBusy(false)
    }
  }

  async function verifyAndDelete() {
    if (!phone) return
    if (!/^\d{4}$/.test(otp)) return setMsg({ text: 'Enter the 4-digit OTP.', kind: 'err' })
    if (!window.confirm('Permanently delete your Astrobook account? This cannot be undone.')) return
    setBusy(true)
    setMsg({ text: 'Verifying...', kind: 'info' })
    try {
      const v = await call<VerifyResponse>('/auth/verify-otp', 'POST', { phone, otp })
      const token = v.data?.accessToken
      if (!token) throw new Error('Verification failed.')
      if (v.data?.isNewUser) throw new Error('No Astrobook account exists for this number.')
      await call('/users/me', 'DELETE', undefined, token)
      setDone(true)
      setMsg({ text: 'Your account has been deleted.', kind: 'ok' })
    } catch (e) {
      setMsg({ text: (e as Error).message, kind: 'err' })
    } finally {
      setBusy(false)
    }
  }

  const msgColor =
    msg?.kind === 'err' ? 'text-danger' : msg?.kind === 'ok' ? 'text-success' : 'text-text-secondary'

  return (
    <div className="min-h-screen bg-bg px-4 py-12 text-text">
      <div className="mx-auto max-w-2xl">
        <p className="font-display text-3xl font-semibold text-text">Astrobook</p>
        <h1 className="mt-6 font-display text-2xl font-semibold text-text">Delete your account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          App: Astrobook (Android, <code>com.astrobook.app</code>) &middot; Developer: Astrobook Tech Team
        </p>

        <Section title="Option 1: Delete from inside the app (fastest)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open the Astrobook app and log in.</li>
            <li>
              Go to <strong className="text-text">Profile &rarr; Settings</strong>.
            </li>
            <li>
              Tap <strong className="text-text">Delete account</strong> and confirm.
            </li>
          </ol>
        </Section>

        <Section title="Option 2: Delete here, without the app">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p>
              If you signed up with your <strong className="text-text">phone number</strong>, you can
              delete your account right here. We will send a one-time code (OTP) to your WhatsApp to
              confirm it is you.
            </p>

            {!done && (
              <>
                <label className="mb-1.5 mt-4 block text-xs font-medium text-text-secondary" htmlFor="phone">
                  Mobile number (India)
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                  placeholder="10-digit mobile number"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  disabled={busy || !!phone}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
                />
                {!phone && (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={busy}
                    className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
                  >
                    Send OTP
                  </button>
                )}
              </>
            )}

            {phone && !done && (
              <>
                <label className="mb-1.5 mt-4 block text-xs font-medium text-text-secondary" htmlFor="otp">
                  4-digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={busy}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={verifyAndDelete}
                  disabled={busy}
                  className="mt-3 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Verify and permanently delete my account
                </button>
              </>
            )}

            <p role="status" aria-live="polite" className={`mt-3 min-h-5 text-sm ${msgColor}`}>
              {msg?.text}
            </p>
            <p className="mt-2 text-xs text-text-faint">
              Deleting is permanent and cannot be undone. You can delete only when you have no
              upcoming or ongoing consultation sessions.
            </p>
          </div>
        </Section>

        <Section title="Option 3: Request by email">
          <p>
            If you signed in with Google, or cannot use Option 2, email us from the address linked to
            your account:
          </p>
          <p className="mt-2">
            <a className="font-semibold text-accent" href="mailto:astrobookconsole@gmail.com?subject=Delete%20my%20Astrobook%20account">
              astrobookconsole@gmail.com
            </a>{' '}
            (subject: &ldquo;Delete my Astrobook account&rdquo;)
          </p>
          <p className="mt-2">
            Include the phone number or Google email used to sign in so we can verify the account. We
            process requests within 30 days.
          </p>
        </Section>

        <Section title="What gets deleted">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your name, phone number, email address and Google sign-in link</li>
            <li>Birth details (date, time, place) and profile photo</li>
            <li>Login sessions and push notification tokens</li>
            <li>Favourites, cart, follows, notifications, post likes and comments</li>
            <li>
              For astrologer accounts: profile bio, photos, banner, intro video, KYC documents and
              posts; your listing and services are switched off
            </li>
          </ul>
        </Section>

        <Section title="What is kept, and for how long">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-text">Booking and payment records</strong> (amounts, dates,
              payment gateway references), with your personal details removed. Required for
              accounting, tax and legal compliance and for the astrologer&apos;s records; kept only as
              long as the law requires.
            </li>
            <li>
              <strong className="text-text">Ratings already given</strong>, kept in anonymised form so
              astrologer rating history stays accurate.
            </li>
          </ul>
          <p className="mt-3">
            After deletion your account cannot be recovered. Signing up again with the same phone
            number creates a fresh account.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-text-secondary">{children}</div>
    </div>
  )
}
