'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { completeOnboarding } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Role } from '@/lib/types/database'

const ROLES: { value: Role; label: string }[] = [
  { value: 'teacher',   label: 'Teacher' },
  { value: 'dh',        label: 'Departmental Head (DH)' },
  { value: 'dp',        label: 'Deputy Principal (DP)' },
  { value: 'principal', label: 'Principal' },
]

type Step = 'account' | 'profile' | 'school'
const STEPS: Step[] = ['account', 'profile', 'school']

export function RegisterForm() {
  const router = useRouter()
  const [step, setStep]     = useState<Step>('account')
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Step 1 — account credentials (collected but not submitted yet)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // Step 2 — personal profile
  const [name, setName]         = useState('')
  const [surname, setSurname]   = useState('')
  const [phone, setPhone]       = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [role, setRole]         = useState<Role>('teacher')

  // Step 3 — school
  const [schoolAction, setSchoolAction] = useState<'join' | 'create'>('join')
  const [joinCode, setJoinCode]         = useState('')
  const [schoolName, setSchoolName]     = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [emisNumber, setEmisNumber]     = useState('')

  const stepIndex = STEPS.indexOf(step)

  // Steps 1 & 2 are pure UI — no Supabase calls, just advance the wizard
  function handleAccountStep(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStep('profile')
  }

  function handleProfileStep(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStep('school')
  }

  // Step 3: signUp first, then hand off to the server action for school + profile
  async function handleSchoolStep(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // Sign up — requires "Confirm email" OFF in Supabase Auth settings
    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (!authData.user) {
      setError('Account created but no session returned. Make sure "Confirm email" is disabled in your Supabase Auth settings.')
      setLoading(false)
      return
    }

    // School creation + profile update run server-side (bypasses RLS via admin client)
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        {/* Step progress bar */}
        <div className="flex gap-1 mt-3">
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

      {/* ── Step 1: Account credentials ── */}
      {step === 'account' && (
        <form onSubmit={handleAccountStep} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.co.za"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password" type="password" required minLength={8}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <Button type="submit" className="w-full">Continue</Button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      )}

      {/* ── Step 2: Personal profile ── */}
      {step === 'profile' && (
        <form onSubmit={handleProfileStep} className="space-y-4">
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
            <Label htmlFor="idNumber">
              ID number <span className="text-gray-400">(optional)</span>
            </Label>
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
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('account')}>
              Back
            </Button>
            <Button type="submit" className="flex-1">Continue</Button>
          </div>
        </form>
      )}

      {/* ── Step 3: School ── */}
      {step === 'school' && (
        <form onSubmit={handleSchoolStep} className="space-y-4">
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
                placeholder="e.g. ABC123"
                className="uppercase tracking-widest"
              />
              <p className="text-xs text-gray-400">Ask your school administrator for the 6-character code.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="schoolName">School name</Label>
                <Input
                  id="schoolName" required
                  value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Mponya Institute of Excellence"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">Address</Label>
                <Input
                  id="schoolAddress"
                  value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)}
                  placeholder="187 Mollo Ave, Mahikeng, 2745"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emisNumber">
                  EMIS number <span className="text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="emisNumber"
                  value={emisNumber} onChange={(e) => setEmisNumber(e.target.value)}
                  placeholder="700123456"
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('profile')}>
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Setting up…' : 'Finish setup'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
