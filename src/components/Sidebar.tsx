import { NavLink } from 'react-router-dom'

const adminItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users' },
  { to: '/astrologers', label: 'Astrologers' },
  { to: '/posts', label: 'Posts' },
  { to: '/consultations', label: 'Consultations' },
  { to: '/earnings', label: 'Earnings' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/payouts', label: 'Payouts' },
  { to: '/refund-requests', label: 'Refund Requests' },
  { to: '/categories', label: 'Categories' },
  { to: '/logs', label: 'Logs' },
]

// Pages for managing AstroBook Official's own content
const myItems = [
  { to: '/my-profile', label: 'My Profile' },
  { to: '/my-posts', label: 'My Posts' },
  { to: '/my-services', label: 'My Services' },
]

function NavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-accent-soft text-accent'
            : 'text-text-secondary hover:bg-surface-alt hover:text-text'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="relative overflow-hidden border-b border-border px-5 py-6">
        {/* faint star-field signature, kept quiet */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(227,165,66,0.35) 0.6px, transparent 0.6px), radial-gradient(circle at 70% 60%, rgba(227,165,66,0.25) 0.6px, transparent 0.6px), radial-gradient(circle at 45% 80%, rgba(227,165,66,0.3) 0.6px, transparent 0.6px)',
            backgroundSize: '40px 40px, 55px 55px, 30px 30px',
          }}
        />
        <p className="relative font-display text-lg font-semibold tracking-tight text-text">
          Astrobook
        </p>
        <p className="relative text-xs text-text-faint">Admin console</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Admin tools */}
        <div className="space-y-1">
          {adminItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        {/* AstroBook Official content management */}
        <div className="mt-5">
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-faint">
            AstroBook Official
          </p>
          <div className="space-y-1">
            {myItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}
