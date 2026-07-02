'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Building2, Calendar, Users, ChevronLeft, X, Check } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

type Project = {
  id: string
  projectNumber: string
  name: string
  address: string | null
  client: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
  _count: { assignments: number; dailyLogs: number }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PLANNING:  { label: 'תכנון',    color: 'bg-blue-100 text-blue-700' },
  ACTIVE:    { label: 'פעיל',     color: 'bg-green-100 text-green-700' },
  ON_HOLD:   { label: 'מושהה',    color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'הושלם',    color: 'bg-slate-100 text-slate-600' },
  CANCELLED: { label: 'בוטל',     color: 'bg-red-100 text-red-600' },
}

const EMPTY_FORM = {
  projectNumber: '', name: '', address: '', client: '',
  status: 'PLANNING', startDate: '', endDate: '', description: '',
}

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.projectNumber || !form.name) return
    setSaving(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      }),
    })
    if (res.ok) {
      const p = await res.json()
      setProjects(ps => [{ ...p, _count: { assignments: 0, dailyLogs: 0 } }, ...ps])
      setShowForm(false)
      setForm(EMPTY_FORM)
      router.push(`/projects/${p.id}`)
    }
    setSaving(false)
  }

  const active = projects.filter(p => p.status === 'ACTIVE').length

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">פרויקטים</h1>
          <p className="text-sm text-slate-500 mt-0.5">{active} פעילים · {projects.length} סה"כ</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />פרויקט חדש
        </button>
      </div>

      {/* New project form */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">פרויקט חדש</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="מספר פרויקט *" value={form.projectNumber} onChange={v => set('projectNumber', v)} placeholder="P-2024-001" />
            <Field label="שם הפרויקט *" value={form.name} onChange={v => set('name', v)} placeholder='בניין X ברחוב Y' />
            <Field label="כתובת" value={form.address} onChange={v => set('address', v)} placeholder="רחוב, עיר" />
            <Field label="לקוח / יזם" value={form.client} onChange={v => set('client', v)} />
            <div>
              <label className="block text-xs text-slate-500 mb-1">סטטוס</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(STATUS_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
            <Field label="תאריך התחלה" value={form.startDate} onChange={v => set('startDate', v)} type="date" />
            <Field label="תאריך סיום" value={form.endDate} onChange={v => set('endDate', v)} type="date" />
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">תיאור</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} disabled={saving || !form.projectNumber || !form.name}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              <Check className="w-4 h-4" />{saving ? 'שומר...' : 'צור פרויקט'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">ביטול</button>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-20 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">אין פרויקטים עדיין</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-blue-600 text-sm hover:underline">הוסף פרויקט ראשון</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const s = STATUS_LABELS[p.status] ?? STATUS_LABELS.PLANNING
            return (
              <Link key={p.id} href={`/projects/${p.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">{p.projectNumber}</div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-blue-700 transition-colors">{p.name}</h3>
                  </div>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0', s.color)}>{s.label}</span>
                </div>
                {p.address && <p className="text-xs text-slate-500 mb-3 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{p.address}</p>}
                {p.client && <p className="text-xs text-slate-500 mb-3">{p.client}</p>}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p._count.assignments} עובדים</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{p._count.dailyLogs} יומנים</span>
                  {p.startDate && <span>{formatDate(p.startDate)}</span>}
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-400 mt-3 mr-auto transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}
