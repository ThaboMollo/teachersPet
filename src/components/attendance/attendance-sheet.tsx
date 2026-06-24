'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Class, Learner, AttendanceStatus } from '@/lib/types/database'
import { CheckCircle, XCircle, Clock, Save } from 'lucide-react'

type AttendanceMap = Record<string, AttendanceStatus>

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'present', label: 'P', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500 hover:bg-green-600 text-white' },
  { value: 'absent',  label: 'A', icon: <XCircle className="w-4 h-4" />,     color: 'bg-red-500 hover:bg-red-600 text-white' },
  { value: 'late',    label: 'L', icon: <Clock className="w-4 h-4" />,        color: 'bg-amber-500 hover:bg-amber-600 text-white' },
]

export function AttendanceSheet({
  classes,
  teacherId,
  schoolId,
}: {
  classes: Pick<Class, 'id' | 'name' | 'grade'>[]
  teacherId: string
  schoolId: string
}) {
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id ?? '')
  const [learners, setLearners] = useState<Learner[]>([])
  const [attendance, setAttendance] = useState<AttendanceMap>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingLearners, setLoadingLearners] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!selectedClass) return
    setLoadingLearners(true)
    const supabase = createClient()

    Promise.all([
      supabase.from('learners').select('*').eq('class_id', selectedClass).order('surname'),
      supabase.from('attendance').select('learner_id, status').eq('class_id', selectedClass).eq('date', today),
    ]).then(([{ data: l }, { data: a }]) => {
      setLearners(l ?? [])
      const map: AttendanceMap = {}
      // Pre-fill existing records
      a?.forEach((r) => { map[r.learner_id] = r.status as AttendanceStatus })
      // Default remaining learners to 'present'
      l?.forEach((learner) => { if (!map[learner.id]) map[learner.id] = 'present' })
      setAttendance(map)
      setLoadingLearners(false)
    })
  }, [selectedClass, today])

  function setStatus(learnerId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [learnerId]: status }))
    setSaved(false)
  }

  async function saveRegister() {
    setSaving(true)
    const supabase = createClient()

    const records = Object.entries(attendance).map(([learner_id, status]) => ({
      class_id: selectedClass,
      learner_id,
      school_id: schoolId,
      date: today,
      status,
      recorded_by: teacherId,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'class_id,learner_id,date' })

    setSaving(false)
    if (!error) setSaved(true)
  }

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length
  const absentCount  = Object.values(attendance).filter((s) => s === 'absent').length
  const lateCount    = Object.values(attendance).filter((s) => s === 'late').length

  return (
    <div className="space-y-4">
      {/* Class selector */}
      <div className="flex flex-wrap gap-2">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => { setSelectedClass(cls.id); setSaved(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedClass === cls.id
                ? 'bg-primary text-white border-primary'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
          >
            {cls.name} <span className="opacity-60">Gr {cls.grade}</span>
          </button>
        ))}
      </div>

      {selectedClass && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {classes.find((c) => c.id === selectedClass)?.name} —{' '}
                {new Date(today).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardTitle>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-600 font-medium">{presentCount} P</span>
                <span className="text-red-500 font-medium">{absentCount} A</span>
                <span className="text-amber-500 font-medium">{lateCount} L</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingLearners ? (
              <p className="text-sm text-gray-400 py-4 text-center">Loading learners…</p>
            ) : learners.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No learners in this class yet.</p>
            ) : (
              <>
                {/* Mark all present shortcut */}
                <div className="flex gap-2 pb-2 border-b border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const map: AttendanceMap = {}
                      learners.forEach((l) => { map[l.id] = 'present' })
                      setAttendance(map)
                      setSaved(false)
                    }}
                  >
                    Mark all present
                  </Button>
                </div>

                {learners.map((learner, i) => {
                  const status = attendance[learner.id] ?? 'present'
                  return (
                    <div
                      key={learner.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {learner.surname}, {learner.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setStatus(learner.id, opt.value)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                              status === opt.value
                                ? opt.color
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={opt.value}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}

                <div className="pt-3 flex items-center justify-between">
                  {saved && <Badge variant="secondary" className="text-green-600">Register saved</Badge>}
                  <Button onClick={saveRegister} disabled={saving} className="ml-auto gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save register'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
