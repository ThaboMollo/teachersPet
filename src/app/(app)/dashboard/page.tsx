import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Megaphone, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/lib/types/database'

const ROLE_LABELS: Record<string, string> = {
  teacher:   'Teacher',
  dh:        'Departmental Head',
  dp:        'Deputy Principal',
  principal: 'Principal',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: announcements }, { data: classes }, { count: learnerCount }] =
    await Promise.all([
      supabase.from('profiles').select('*, schools(name)').eq('id', user.id).single(),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('classes').select('id, name, grade'),
      supabase.from('learners').select('*', { count: 'exact', head: true }),
    ])

  if (!profile) redirect('/login')

  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const quickLinks = [
    { href: '/attendance',    label: 'Take Attendance',  icon: ClipboardList, desc: 'Record today\'s class register' },
    { href: '/announcements', label: 'Announcements',    icon: Megaphone,     desc: 'View school notices' },
    { href: '/learners',      label: 'Learners',         icon: Users,         desc: `${learnerCount ?? 0} in your school` },
    { href: '/lesson-plans',  label: 'Lesson Plans',     icon: BookOpen,      desc: 'Plan and prepare lessons' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Good day, {profile.name}
          </h1>
          <Badge variant="secondary">{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
        {(profile as Profile & { schools?: { name: string } }).schools?.name && (
          <p className="text-sm text-gray-400">
            {(profile as Profile & { schools?: { name: string } }).schools?.name}
          </p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickLinks.map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-5 pb-4 px-4 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* My classes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">My Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {classes && classes.length > 0 ? (
              classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-700">{cls.name}</span>
                  <Badge variant="outline">Grade {cls.grade}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No classes assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent announcements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements && announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-800">{ann.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(ann.created_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No announcements yet.</p>
            )}
            {announcements && announcements.length > 0 && (
              <Link href="/announcements" className="text-xs text-primary hover:underline">
                View all
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
