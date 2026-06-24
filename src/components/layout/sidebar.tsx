'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'
import {
  LayoutDashboard,
  ClipboardList,
  Megaphone,
  BookOpen,
  Users,
  LogOut,
  UserCircle,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/attendance',    label: 'Class Register', icon: ClipboardList },
  { href: '/announcements', label: 'Announcements',  icon: Megaphone },
  { href: '/lesson-plans',  label: 'Lesson Plans',   icon: BookOpen },
  { href: '/learners',      label: 'Learners',       icon: Users },
]

const ROLE_LABELS: Record<string, string> = {
  teacher:   'Teacher',
  dh:        'Dept. Head',
  dp:        'Deputy Principal',
  principal: 'Principal',
}

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-64 h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm">
          🐾
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Teacher&apos;s PET</p>
          <p className="text-[10px] text-white/50">Innobuntu Group</p>
        </div>
      </div>

      {/* Profile chip — links to profile page */}
      <Link href="/profile" className="block px-4 py-4 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors">
        <div className="flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-white/50 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile.name} {profile.surname}
            </p>
            <p className="text-xs text-white/50">{ROLE_LABELS[profile.role] ?? profile.role}</p>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
