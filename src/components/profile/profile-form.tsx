'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'
import type { Profile, Role } from '@/lib/types/database'

const ROLES: { value: Role; label: string }[] = [
  { value: 'teacher',   label: 'Teacher' },
  { value: 'dh',        label: 'Departmental Head (DH)' },
  { value: 'dp',        label: 'Deputy Principal (DP)' },
  { value: 'principal', label: 'Principal' },
]

type School = { name: string; join_code: string; address: string | null; emis_number: string | null } | null

export function ProfileForm({ profile, school, email }: { profile: Profile; school: School; email: string }) {
  const [name, setName]         = useState(profile.name)
  const [surname, setSurname]   = useState(profile.surname)
  const [phone, setPhone]       = useState(profile.phone ?? '')
  const [idNumber, setIdNumber] = useState(profile.id_number ?? '')
  const [address, setAddress]   = useState(profile.address ?? '')
  const [role, setRole]         = useState<Role>(profile.role)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const result = await updateProfile({ name, surname, phone, idNumber, role, address })

    setSaving(false)
    if (!result.ok) { setError(result.error); return }
    setSaved(true)
  }

  function copyJoinCode() {
    if (!school?.join_code) return
    navigator.clipboard.writeText(school.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* School card */}
      {school && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">School</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{school.name}</p>
                {school.address && <p className="text-sm text-gray-500">{school.address}</p>}
                {school.emis_number && <p className="text-xs text-gray-400">EMIS: {school.emis_number}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">School join code</p>
                <p className="text-lg font-mono font-bold tracking-widest text-primary">{school.join_code}</p>
              </div>
              <Button size="sm" variant="outline" onClick={copyJoinCode} className="gap-2 shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy code'}
              </Button>
            </div>
            <p className="text-xs text-gray-400">Share this code with colleagues so they can join your school.</p>
          </CardContent>
        </Card>
      )}

      {/* Profile form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-2">
              <Label>Email address</Label>
              <Input value={email} disabled className="bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400">Email cannot be changed here.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">First name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input id="surname" required value={surname} onChange={(e) => setSurname(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="082 000 0000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID number</Label>
              <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="8001015009087" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Rustenburg" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {saved && <Badge variant="secondary" className="text-green-600">Saved</Badge>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
