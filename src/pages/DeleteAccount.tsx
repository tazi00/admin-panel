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

// Public, unauthenticated page — linked as the "Delete account URL" in Google Play
// Console (Data safety). Keep this route OUTSIDE <ProtectedLayout> in App.tsx.
//
// Static / informational only: no API calls from this page. Deletion requests
// come in by email and are processed manually (see "Option 2").

export function DeleteAccount() {
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

        <Section title="Option 2: Request deletion by email">
          <p>
            If you cannot use the app, or signed in with Google, email us from the address linked to
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
            process requests within 30 days and confirm by email once your account is deleted. You can
            delete only when you have no upcoming or ongoing consultation sessions.
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-text-secondary">{children}</div>
    </div>
  )
}
