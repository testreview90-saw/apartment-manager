'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { href: '/dashboard',              label: 'Dashboard' },
  { href: '/dashboard/rooms',        label: 'Rooms' },
  { href: '/dashboard/tenants',      label: 'Tenants' },
  { href: '/dashboard/bills',        label: 'Bills' },
  { href: '/dashboard/applications', label: 'Applications' },
  { href: '/dashboard/settings',     label: 'Settings' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Hamburger button (mobile only) */}
      <button
        className="hamburger-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Dark overlay (mobile only) */}
      <div
        className={`sidebar-overlay${open ? ' mobile-open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar-nav${open ? ' mobile-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Apartment Manager</p>
          {/* Close button inside sidebar on mobile */}
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '18px', cursor: 'pointer', display: 'none' }}
            className="sidebar-close"
          >✕</button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {nav.map(({ href, label }) => {
            const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginBottom: '2px',
                  background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.65)',
                  fontWeight: active ? '600' : '400',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button
            onClick={logout}
            style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  )
}
