'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/rooms', label: 'Rooms' },
  { href: '/dashboard/tenants', label: 'Tenants' },
  { href: '/dashboard/bills', label: 'Bills' },
  { href: '/dashboard/applications', label: 'Applications' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ width: '220px', minHeight: '100vh', background: '#15803d', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <p style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Apartment Manager</p>
      </div>
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {nav.map(({ href, label }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '10px 12px',
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
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <button
          onClick={logout}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
