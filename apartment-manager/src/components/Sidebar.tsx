'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users,
  Receipt, ClipboardList, Settings, LogOut,
} from 'lucide-react'

const nav = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'ภาพรวม' },
  { href: '/dashboard/rooms',        icon: Building2,       label: 'ห้องพัก' },
  { href: '/dashboard/tenants',      icon: Users,           label: 'ผู้เช่า' },
  { href: '/dashboard/bills',        icon: Receipt,         label: 'ค่าใช้จ่าย' },
  { href: '/dashboard/applications', icon: ClipboardList,   label: 'ผู้สมัคร' },
  { href: '/dashboard/settings',     icon: Settings,        label: 'ตั้งค่า' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="w-56 min-h-screen bg-primary-600 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Apartment</div>
            <div className="text-white/50 text-xs">Manager</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 border-t border-white/10 pt-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all w-full text-sm"
        >
          <LogOut size={17} className="flex-shrink-0" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}
