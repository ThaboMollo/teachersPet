'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile, Role } from '@/lib/types/database'

const ROLES: { value: Role; label: string }[] = [
  { value: 'teacher',   label: 'Teacher' },
  { value: 'dh',        label: 'Departmental Head (DH)' },
  { value: 'dp',        label: 'Deputy Principal (DP)' },
  { value: 'principal', label: 'Principal' },
]

type Step = 'profile' | 'school'
const STEPS: Step[] = ['profile', 'school']

export function OnboardingForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [step, setStep]     = useState<Step>(profile.name ? 'school' : 'profile')
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Profile fields — pre-filled from existing data
  const [name, setName]         = useState(profile.name ?? '')
  const [surname, setSurname]   = useState(profile.surname ?? '')
  const [phone, setPhone]       = useState(profile.phone ?? '')
  const [idNumber, setIdNumber] = useState(profile.id_number ?? '')
  const [role, setRole]         = useState<Role>(profile.role ?? 'teacher')

  // School fields
  const [schoolAction, setSchoolAction] = useState<'join' | 'create'>('join')
  const [joinCode, setJoinCode]         = useState('')
  const [schoolName, setSchoolName]     = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [emisNumber, setEmisNumber]     = useState('')

  const stepIndex = STEPS.indexOf(step)

  function handleProfileStep(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStep('school')
  }

  async function handleSchoolStep(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await completeOnboarding({
      name, surname, phone, idNumber, role,
      schoolAction,
      joinCode,
      schoolName,
      schoolAddress,
      emisNumber,
    })

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F1F3D] to-[#1a3a6b] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
              🐾
            </div>
            <span className="text-2xl font-bold text-white">Teacher&apos;s</span>
            <span className="text-2xl font-bold text-primary">PET</span>
          </div>
          <p className="text-sm text-white/60">Let&apos;s finish setting up your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
          {/* Progress */}
          <div>
            <div className="flex gap-1">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    stepIndex >= i ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Step {stepIndex + 1} of {STEPS.length}</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Step 1: Profile ── */}
          {step === 'profile' && (
            <form onSubmit={handleProfileStep} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tell us about yourself</h2>
                <p className="text-sm text-gray-500 mt-1">This personalises your experience.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">First name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Thabo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input id="surname" required value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Mokoena" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="082 000 0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID number <span className="text-gray-400">(optional)</span></Label>
                <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="8001015009087" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <select
                  id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <Button type="submit" className="w-full">Continue</Button>
            </form>
          )}

          {/* ── Step 2: School ── */}
          {step === 'school' && (
            <form onSubmit={handleSchoolStep} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Connect to your school</h2>
                <p className="text-sm text-gray-500 mt-1">Join an existing school or register a new one.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['join', 'create'] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setSchoolAction(action)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      schoolAction === action
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {action === 'join' ? 'Join a school' : 'Register a school'}
                  </button>
                ))}
              </div>

              {schoolAction === 'join' ? (
                <div className="space-y-2">
                  <Label htmlFor="joinCode">School join code</Label>
                  <Input
                    id="joinCode" required
                    value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ABC123"
                    className="uppercase tracking-widest"
                  />
                  <p className="text-xs text-gray-400">Ask your school administrator for the 6-character code.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School name</Label>
                    <Input id="schoolName" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Mponya Institute of Excellence" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolAddress">Address</Label>
                    <Input id="schoolAddress" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} placeholder="187 Mollo Ave, Mahikeng, 2745" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emisNumber">EMIS number <span className="text-gray-400">(optional)</span></Label>
                    <Input id="emisNumber" value={emisNumber} onChange={(e) => setEmisNumber(e.target.value)} placeholder="700123456" />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                {!profile.name && (
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('profile')}>
                    Back
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Setting up…' : 'Finish setup'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
