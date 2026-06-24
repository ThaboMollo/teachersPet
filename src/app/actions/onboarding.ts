'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/lib/types/database'

export type OnboardingPayload = {
  // Profile
  name: string
  surname: string
  phone: string
  idNumber: string
  role: Role
  // School
  schoolAction: 'join' | 'create'
  joinCode?: string
  schoolName?: string
  schoolAddress?: string
  emisNumber?: string
}

export type OnboardingResult =
  | { ok: true; joinCode: string }
  | { ok: false; error: string }

export async function completeOnboarding(payload: OnboardingPayload): Promise<OnboardingResult> {
  // Verify the caller is authenticated
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Not authenticated. Please sign in again.' }

  // All writes go through the admin client so RLS is not a blocker
  const admin = createAdminClient()

  let schoolId: string
  let joinCode: string

  if (payload.schoolAction === 'create') {
    joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: school, error: schoolErr } = await admin
      .from('schools')
      .insert({
        name: payload.schoolName!,
        address: payload.schoolAddress || null,
        emis_number: payload.emisNumber || null,
        join_code: joinCode,
      })
      .select('id')
      .single()

    if (schoolErr || !school) {
      return { ok: false, error: schoolErr?.message ?? 'Failed to create school.' }
    }
    schoolId = school.id
  } else {
    const { data: school, error: schoolErr } = await admin
      .from('schools')
      .select('id, join_code')
      .eq('join_code', payload.joinCode!.trim().toUpperCase())
      .single()

    if (schoolErr || !school) {
      return { ok: false, error: 'School not found. Double-check the join code.' }
    }
    schoolId = school.id
    joinCode = school.join_code
  }

  // Update the profile
  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      name:                payload.name,
      surname:             payload.surname,
      phone:               payload.phone     || null,
      id_number:           payload.idNumber  || null,
      role:                payload.role,
      school_id:           schoolId,
      onboarding_complete: true,
    })
    .eq('id', user.id)

  if (profileErr) return { ok: false, error: profileErr.message }

  return { ok: true, joinCode }
}
