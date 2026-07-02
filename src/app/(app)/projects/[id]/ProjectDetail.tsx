'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Building2, Users, Calendar, Plus, X, Pencil, Check,
  ClipboardList, UserPlus, Search, Lock, FileText,
} from 'lucide-react'
import { cn, formatDate, getInitials } from '@/lib/utils'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PLANNING:  { label: 'תכנון',  color: 'bg-blue-100 text-blue-700' },
  ACTIVE:    { label: 'פעיל',   color: 'bg-green-100 text-green-700' },
  ON_HOLD:   { label: 'מושהה',  color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'הושלם', color: 'bg-slate-100 text-slate-600' },
  CANCELLED: { label: 'בוטל',  color: 'bg-red-100 text-red-600' },
}

const LOG_STATUS: Record<string, string> = { DRAFT: 'טיוטה', LOCKED: 'נעול' }

type Employee = { id: string; firstName: string; lastName: string; photoUrl: string | null; role: string | null; mobile?: string | null; status?: string }
type Assignment = { id: string; siteRole: string | null; employee: Employee }
type DailyLog = { id: string; logDate: Date; status: string; weatherStatus: string | null; temperature: number | null; createdBy: string | null; _count: { attendance: number } }
type Project = {
  id: string; projectNumber: string; name: string; address: string | null; client: string | null
  status: string; startDate: Date | null; endDate: Date | null; description: string | null; notes: string | null
  assignments: Assignment[]; dailyLogs: DailyLog[]
}

type Tab = 'team' | 'logs' | 'info'

export default function ProjectDetail({ project: initial, allEmployees }: { project: Project; allEmployees: Employee[] }) {
  const router = useRouter()
  const [project, setProject] = useState(initial)
  const [tab, setTab] = useState<Tab>('logs')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [addingEmployee, setAddingEmployee] = useState(false)

  const assignedIds = new Set(project.assignments.map(a => a.employee.id))
  const available = allEmployees.filter(e =>
    !assignedIds.has(e.id) &&
    (e.firstName + ' ' + e.lastName).toLowerCase().includes(search.toLowerCase())
  )

  function startEdit() {
    setEditData({
      name: project.name, address: project.address ?? '', client: project.client ?? '',
      status: project.status, description: project.description ?? '', notes: project.notes ?? '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    })
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editData,
        startDate: editData.startDate || null,
        endDate: editData.endDate || null,
      }),
    })
    if (res.ok) { const d = await res.json(); setProject(p => ({ ...p, ...d })); setEditing(false) }
    setSaving(false)
  }

  async function addEmployee(empId: string) {
    const res = await fetch(`/api/projects/${project.id}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: empId, siteRole: null }),
    })
    if (res.ok) {
      const a = await res.json()
      setProject(p => ({ ...p, assignments: [...p.assignments, a] }))
      setSearch('')
    }
  }

  async function removeEmployee(empId: string) {
    await fetch(`/api/projects/${project.id}/assignments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: empId }),
    })
    setProject(p => ({ ...p, assignments: p.assignments.filter(a => a.employee.id !== empId) }))
  }

  const s = STATUS_LABELS[project.status] ?? STATUS_LABELS.PLANNING

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
        <ArrowRight className="w-4 h-4" />חזרה לפרויקטים
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        {editing ? (
          <div className="space-y-3">
            <EditField label="שם פרויקט" value={editData.name ?? ''} onChange={v => setEditData(d => ({ ...d, name: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <EditField label="כתובת" value={editData.address ?? ''} onChange={v => setEditData(d => ({ ...d, address: v }))} />
              <EditField label="לקוח / יזם" value={editData.client ?? ''} onChange={v => setEditData(d => ({ ...d, client: v }))} />
              <EditField label="תחילה" value={editData.startDate ?? ''} onChange={v => setEditData(d => ({ ...d, startDate: v }))} type="date" />
              <EditField label="סיום" value={editData.endDate ?? ''} onChange={v => setEditData(d => ({ ...d, endDate: v }))} type="date" />
              <div>
                <label className="block text-xs text-slate-500 mb-1">סטטוס</label>
                <select value={editData.status ?? ''} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                  {Object.entries(STATUS_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
            </div>
            <EditField label="תיאור" value={editData.description ?? ''} onChange={v => setEditData(d => ({ ...d, description: v }))} textarea />
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                <Check className="w-3.5 h-3.5" />{saving ? 'שומר...' : 'שמור'}
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">ביטול</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">{project.projectNumber}</span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', s.color)}>{s.label}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
              {project.address && <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{project.address}</p>}
              {project.client && <p className="text-sm text-slate-500 mt-0.5">{project.client}</p>}
              {project.description && <p className="text-sm text-slate-600 mt-2">{project.description}</p>}
              <div className="flex gap-4 mt-3 text-xs text-slate-400">
                {project.startDate && <span>התחלה: {formatDate(project.startDate)}</span>}
                {project.endDate && <span>סיום: {formatDate(project.endDate)}</span>}
                <span>{project.assignments.length} עובדים · {project.dailyLogs.length} יומנים</span>
              </div>
            </div>
            <button onClick={startEdit} className="flex items-center gap-1.5 border border-slate-200 text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 flex-shrink-0">
              <Pencil className="w-3.5 h-3.5" />עריכה
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([['logs', 'יומן עבודה', ClipboardList], ['team', 'צוות', Users]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all flex-1 md:flex-none justify-center',
              tab === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300')}>
            <Icon className="w-4 h-4" />{label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === id ? 'bg-blue-500' : 'bg-slate-100 text-slate-500')}>
              {id === 'logs' ? project.dailyLogs.length : project.assignments.length}
            </span>
          </button>
        ))}
      </div>

      {/* Team tab */}
      {tab === 'team' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-medium text-slate-800 text-sm">צוות הפרויקט</span>
            <button onClick={() => setAddingEmployee(!addingEmployee)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <UserPlus className="w-3.5 h-3.5" />הוסף עובד
            </button>
          </div>

          {addingEmployee && (
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative mb-3">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש עובד..."
                  className="w-full pr-9 pl-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {available.slice(0, 20).map(e => (
                  <button key={e.id} onClick={() => addEmployee(e.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white text-sm text-right">
                    <Avatar emp={e} size="sm" />
                    <span className="font-medium text-slate-800">{e.firstName} {e.lastName}</span>
                    <span className="text-slate-400 text-xs">{e.role}</span>
                    <Plus className="w-3.5 h-3.5 text-blue-500 mr-auto" />
                  </button>
                ))}
                {available.length === 0 && <p className="text-xs text-slate-400 text-center py-2">לא נמצאו עובדים זמינים</p>}
              </div>
            </div>
          )}

          {project.assignments.length === 0 && !addingEmployee ? (
            <div className="py-10 text-center text-slate-400 text-sm">אין עובדים משויכים לפרויקט</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {project.assignments.map(a => (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                  <Avatar emp={a.employee} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm">{a.employee.firstName} {a.employee.lastName}</div>
                    <div className="text-xs text-slate-400">{a.siteRole ?? a.employee.role ?? '—'}</div>
                  </div>
                  {a.employee.mobile && <a href={`tel:${a.employee.mobile}`} className="text-xs text-blue-600 hover:underline">{a.employee.mobile}</a>}
                  <button onClick={() => removeEmployee(a.employee.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs tab */}
      {tab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-medium text-slate-800 text-sm">יומני עבודה</span>
            <Link href={`/projects/${project.id}/logs/new`}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <Plus className="w-3.5 h-3.5" />יומן חדש
            </Link>
          </div>

          {project.dailyLogs.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm mb-3">אין יומנים עדיין</p>
              <Link href={`/projects/${project.id}/logs/new`}
                className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" />פתח יומן ראשון
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {project.dailyLogs.map(log => (
                <Link key={log.id} href={`/projects/${project.id}/logs/${log.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm">{formatDate(log.logDate)}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {log._count.attendance} עובדים
                      {log.temperature !== null && ` · ${log.temperature}°C`}
                      {log.weatherStatus && ` · ${log.weatherStatus}`}
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    log.status === 'LOCKED' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600')}>
                    {log.status === 'LOCKED' ? <span className="flex items-center gap-1"><Lock className="w-3 h-3" />{LOG_STATUS[log.status]}</span> : LOG_STATUS[log.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Avatar({ emp, size = 'md' }: { emp: Employee; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  if (emp.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={emp.photoUrl} alt="" className={cn(sz, 'rounded-full object-cover flex-shrink-0')} />
  }
  return (
    <div className={cn(sz, 'rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0')}>
      {getInitials(emp.firstName, emp.lastName)}
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text', textarea }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean
}) {
  const cls = "w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className={cn(cls, 'resize-none')} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} />}
    </div>
  )
}
