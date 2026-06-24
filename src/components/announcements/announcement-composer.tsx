'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
import type { AnnouncementType } from '@/lib/types/database'

const TYPES: { value: AnnouncementType; label: string }[] = [
  { value: 'general',     label: 'General' },
  { value: 'meeting',     label: 'Meeting' },
  { value: 'word_of_day', label: 'Word of Day' },
  { value: 'urgent',      label: 'Urgent' },
]

export function AnnouncementComposer({ schoolId, createdBy }: { schoolId: string; createdBy: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<AnnouncementType>('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from('announcements').insert({
      school_id: schoolId,
      created_by: createdBy,
      title,
      body,
      type,
    })

    setLoading(false)
    if (error) { setError(error.message); return }

    setTitle('')
    setBody('')
    setType('general')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        Post announcement
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New announcement</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handlePost} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ann-type">Type</Label>
                <select
                  id="ann-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as AnnouncementType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ann-title">Title</Label>
                <Input
                  id="ann-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Staff meeting this Friday"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ann-body">Message</Label>
                <textarea
                  id="ann-body"
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your announcement here…"
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
