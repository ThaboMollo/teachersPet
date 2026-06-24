'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/lib/types/database'

export type UpdateProfilePayload = {
  name: string
  surname: string
  phone: string
  idNumber: string
  role: Role
  address: string
}

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateProfile(payload: UpdateProfilePayload): Promise<UpdateProfileResult> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { ok: false, error: 'Not authenticated.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({
      name:      payload.name,
      surname:   payload.surname,
      phone:     payload.phone    || null,
      id_number: payload.idNumber || null,
      role:      payload.role,
      address:   payload.address  || null,
    })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
