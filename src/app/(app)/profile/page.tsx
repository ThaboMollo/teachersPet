import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: school }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('schools').select('name, join_code, address, emis_number').eq('id',
      (await supabase.from('profiles').select('school_id').eq('id', user.id).single()).data?.school_id ?? ''
    ).single(),
  ])

  if (!profile) redirect('/login')

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal details and account information.</p>
      </div>
      <ProfileForm profile={profile} school={school} email={user.email ?? ''} />
    </div>
  )
}
