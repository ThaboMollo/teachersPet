import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AttendanceSheet } from '@/components/attendance/attendance-sheet'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('school_id, role').eq('id', user.id).single()
  if (!profile?.school_id) {
    return (
      <div className="p-6">
        <p className="text-gray-500">You are not associated with a school yet. Please complete your profile setup.</p>
      </div>
    )
  }

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade')
    .eq('school_id', profile.school_id)
    .order('grade')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Class Register</h1>
        <p className="text-sm text-gray-500 mt-1">Take attendance for today</p>
      </div>
      <AttendanceSheet classes={classes ?? []} teacherId={user.id} schoolId={profile.school_id} />
    </div>
  )
}
