import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { AnnouncementComposer } from '@/components/announcements/announcement-composer'
import type { Announcement, AnnouncementType } from '@/lib/types/database'

type AnnouncementWithAuthor = Announcement & {
  profiles: { name: string; surname: string } | null
}

const TYPE_CONFIG: Record<AnnouncementType, { label: string; color: string }> = {
  general:    { label: 'General',     color: 'bg-blue-100 text-blue-800' },
  meeting:    { label: 'Meeting',     color: 'bg-purple-100 text-purple-800' },
  word_of_day:{ label: 'Word of Day', color: 'bg-green-100 text-green-800' },
  urgent:     { label: 'Urgent',      color: 'bg-red-100 text-red-800' },
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role, name, surname')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) {
    return <div className="p-6"><p className="text-gray-500">No school association found.</p></div>
  }

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, profiles(name, surname)')
    .eq('school_id', profile.school_id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .returns<AnnouncementWithAuthor[]>()

  const canPost = ['dh', 'dp', 'principal'].includes(profile.role)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">School notices and updates</p>
        </div>
        {canPost && (
          <AnnouncementComposer schoolId={profile.school_id} createdBy={user.id} />
        )}
      </div>

      <div className="space-y-3">
        {announcements && announcements.length > 0 ? (
          announcements.map((ann) => {
            const cfg = TYPE_CONFIG[ann.type as AnnouncementType] ?? TYPE_CONFIG.general
            return (
              <Card key={ann.id}>
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{ann.title}</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{ann.body}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{ann.profiles?.name} {ann.profiles?.surname}</span>
                    <span>·</span>
                    <span>{new Date(ann.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No announcements yet</p>
            <p className="text-sm mt-1">Leadership can post announcements for the school.</p>
          </div>
        )}
      </div>
    </div>
  )
}
