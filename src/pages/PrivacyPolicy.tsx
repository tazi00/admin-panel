// Public, unauthenticated page — linked from the Play Store / App Store listing.
// Keep this route OUTSIDE <ProtectedLayout> in App.tsx so it loads without login.

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg px-4 py-12 text-text">
      <div className="mx-auto max-w-2xl">
        <p className="font-display text-3xl font-semibold text-text">Astrobook</p>
        <h1 className="mt-6 font-display text-2xl font-semibold text-text">Privacy Policy</h1>
        <p className="mt-1 text-sm text-text-secondary">Last updated: October 3, 2026</p>

        <p className="mt-8 text-sm leading-relaxed text-text-secondary">
          Astrobook ("we", "us", "our") operates the Astrobook mobile application (the "App"),
          which connects users with astrologers for live video, audio, and chat consultations.
          This policy explains what information we collect, how we use it, and the choices you have.
        </p>

        <Section title="Information we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-text">Account information:</strong> phone number (for
              OTP-based sign-in), name, email address, and Google account details if you sign in
              with Google.
            </li>
            <li>
              <strong className="text-text">Profile &amp; consultation details:</strong> date,
              time, and place of birth, and any notes you provide, used to enable astrology
              consultations.
            </li>
            <li>
              <strong className="text-text">Payment information:</strong> consultation payments
              are processed by our payment partner, Razorpay. We do not store your card, UPI, or
              bank details on our servers.
            </li>
            <li>
              <strong className="text-text">Communications data:</strong> video, audio, and chat
              session metadata (e.g. duration, participants) to operate and improve live
              consultations. Call content itself is not recorded or stored by us.
            </li>
            <li>
              <strong className="text-text">Device &amp; usage data:</strong> device type, app
              version, and push notification tokens, used to deliver notifications and maintain
              app reliability.
            </li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <ul className="list-disc space-y-2 pl-5">
            <li>To create and manage your account, and verify your identity via OTP or Google Sign-In.</li>
            <li>To connect you with astrologers and facilitate booking, scheduling, and live consultations.</li>
            <li>To process payments securely through Razorpay.</li>
            <li>To send booking confirmations, reminders, and service-related notifications.</li>
            <li>To improve app performance, fix issues, and develop new features.</li>
          </ul>
        </Section>

        <Section title="Sharing of information">
          <p className="mb-3">We do not sell your personal information. We share information only with:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-text">Astrologers you book with</strong> — limited profile
              and consultation details needed to provide the service.
            </li>
            <li>
              <strong className="text-text">Service providers</strong> who help us operate the
              app, including Razorpay (payments), Agora (video/audio calling infrastructure), and
              Firebase/Google (push notifications, authentication) — each bound to use data only
              to provide their service to us.
            </li>
            <li>
              <strong className="text-text">Legal authorities</strong>, where required by law.
            </li>
          </ul>
        </Section>

        <Section title="Data retention">
          <p>
            We retain account and consultation data for as long as your account is active, or as
            needed to provide the service, comply with legal obligations, and resolve disputes.
            You may request deletion of your account and associated data at any time (see Contact
            below).
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc space-y-2 pl-5">
            <li>You can update your profile information within the app.</li>
            <li>You can request access to, correction of, or deletion of your personal data by contacting us.</li>
            <li>You can disable push notifications from your device settings at any time.</li>
          </ul>
        </Section>

        <Section title="Security">
          <p>
            We use industry-standard measures, including encryption in transit, to protect your
            information. No method of transmission or storage is 100% secure, and we continually
            work to improve our safeguards.
          </p>
        </Section>

        <Section title="Children's privacy">
          <p>
            Astrobook is not directed at children under 18. We do not knowingly collect personal
            information from children.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes will be reflected by
            updating the "Last updated" date above.
          </p>
        </Section>

        <hr className="my-10 border-border" />

        <Section title="Contact us">
          <p className="mb-2">
            For privacy questions, data access, or deletion requests, contact us at:
          </p>
          <p className="font-semibold text-accent">astrobookconsole@gmail.com</p>
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
