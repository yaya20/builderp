'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Plus, AlertTriangle, Users, Cake, FileText, ChevronLeft } from 'lucide-react'
import { cn, formatDate, getDaysUntil, getInitials, employmentTypeLabel } from '@/lib/utils'

type Cert = { expiryDate: Date | null; certType: string }
type Employee = {
  id: string
  employeeNumber: number
  firstName: string
  lastName: string
  idNumber: string
  mobile: string | null
  role: string | null
  status: string
  employmentType: string
  certifications: Cert[]
  _count: { documents: number }
}

type DashboardData = {
  activeCount: number
  inactiveCount: number
  expiringCerts: number
  urgentCerts: Array<{ certType: string; expiryDate: Date | null; employee: { firstName: string; lastName: string } }>
  birthdays: Array<{ firstName: string; lastName: string; birthDate: Date | null }>
}

function getCertStatus(certs: Cert[]) {
  const today = Date.now()
  const in7 = today + 7 * 86400000
  const in30 = today + 30 * 86400000
  for (const c of certs) {
    if (!c.expiryDate) continue
    const t = new Date(c.expiryDate).getTime()
    if (t <= today) return 'expired'
    if (t <= in7) return 'urgent'
    if (t <= in30) return 'warning'
  }
  return 'ok'
}

export default function EmployeesClient({
  dashboard,
  initialEmployees,
}: {
  dashboard: DashboardData
  initialEmployees: Employee[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return initialEmployees.filter((e) => {
      const matchQ =
        !q ||
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.idNumber.includes(q) ||
        (e.mobile ?? '').includes(q)
      const matchStatus = !statusFilter || e.status === statusFilter
      const matchType = !typeFilter || e.employmentType === typeFilter
      return matchQ && matchStatus && matchType
    })
  }, [initialEmployees, search, statusFilter, typeFilter])

  const urgentAlerts = dashboard.urgentCerts
  const hasAlerts = urgentAlerts.length > 0 || dashboard.birthdays.length > 0

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900">עובדים</h1>
        <Link
          href="/employees/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          הוסף עובד
        </Link>
      </div>

      {/* ─── Dashboard strip ─── */}
      <div className="space-y-2 mb-6">
        {/* Row 1: stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{dashboard.activeCount}</div>
              <div className="text-xs text-slate-500">עובדים פעילים</div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-500">{dashboard.inactiveCount}</div>
              <div className="text-xs text-slate-500">לא פעילים</div>
            </div>
          </div>
          <div
            className={cn(
              'border rounded-xl p-4 flex items-center gap-3',
              dashboard.expiringCerts > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-slate-200'
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                dashboard.expiringCerts > 0 ? 'bg-amber-100' : 'bg-slate-100'
              )}
            >
              <AlertTriangle
                className={cn(
                  'w-5 h-5',
                  dashboard.expiringCerts > 0 ? 'text-amber-600' : 'text-slate-400'
                )}
              />
            </div>
            <div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  dashboard.expiringCerts > 0 ? 'text-amber-700' : 'text-slate-500'
                )}
              >
                {dashboard.expiringCerts}
              </div>
              <div className="text-xs text-slate-500">הסמכות פגות תוך 30 יום</div>
            </div>
          </div>
          <div
            className={cn(
              'border rounded-xl p-4 flex items-center gap-3',
              dashboard.birthdays.length > 0
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-slate-200'
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                dashboard.birthdays.length > 0 ? 'bg-blue-100' : 'bg-slate-100'
              )}
            >
              <Cake
                className={cn(
                  'w-5 h-5',
                  dashboard.birthdays.length > 0 ? 'text-blue-600' : 'text-slate-400'
                )}
              />
            </div>
            <div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  dashboard.birthdays.length > 0 ? 'text-blue-700' : 'text-slate-500'
                )}
              >
                {dashboard.birthdays.length}
              </div>
              <div className="text-xs text-slate-500">ימי הולדת החודש</div>
            </div>
          </div>
        </div>

        {/* Row 2: alerts */}
        {hasAlerts && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap gap-x-6 gap-y-2">
            {urgentAlerts.map((a, i) => {
              const days = getDaysUntil(a.expiryDate)
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="font-medium text-red-700">
                    {a.employee.firstName} {a.employee.lastName}
                  </span>
                  <span className="text-slate-600">
                    — {a.certType} פגה{' '}
                    {days !== null && days <= 0
                      ? 'כבר פגה!'
                      : `בעוד ${days} ימים`}
                  </span>
                </div>
              )
            })}
            {dashboard.birthdays.map((b, i) => (
              <div key={`bd-${i}`} className="flex items-center gap-2 text-sm">
                <Cake className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-slate-600">
                  🎂 {b.firstName} {b.lastName} — יום הולדת החודש
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Search & filters ─── */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, ת.ז., טלפון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">כל הסטטוסים</option>
          <option value="ACTIVE">פעיל</option>
          <option value="INACTIVE">לא פעיל</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">כל סוגי ההעסקה</option>
          <option value="COMPANY">עובד חברה</option>
          <option value="CONTRACTOR">קבלן</option>
          <option value="MANPOWER">כוח אדם</option>
        </select>
      </div>

      {/* ─── Employee list ─── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:grid px-4 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 grid-cols-12 gap-3">
          <span className="col-span-4">שם עובד</span>
          <span className="col-span-2">מס' עובד</span>
          <span className="col-span-2">תפקיד</span>
          <span className="col-span-2">סוג העסקה</span>
          <span className="col-span-1">סטטוס</span>
          <span className="col-span-1"></span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">לא נמצאו עובדים</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((emp) => {
              const certStatus = getCertStatus(emp.certifications)
              const initials = getInitials(emp.firstName, emp.lastName)
              return (
                <Link
                  key={emp.id}
                  href={`/employees/${emp.id}`}
                  className="block hover:bg-slate-50 transition-colors group"
                >
                  {/* Mobile card */}
                  <div className="md:hidden px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-sm">{emp.firstName} {emp.lastName}</span>
                        <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', emp.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-400')} />
                          {emp.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                        </span>
                        {(certStatus === 'expired' || certStatus === 'urgent') && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        {certStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{emp.role ?? ''}{emp.role && emp.mobile ? ' · ' : ''}{emp.mobile ?? ''}</div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>

                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 items-center">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{emp.firstName} {emp.lastName}</div>
                        {emp.mobile && <div className="text-xs text-slate-400">{emp.mobile}</div>}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-slate-500">#{String(emp.employeeNumber).padStart(4, '0')}</div>
                    <div className="col-span-2 text-sm text-slate-600">{emp.role ?? '—'}</div>
                    <div className="col-span-2 text-sm text-slate-600">{employmentTypeLabel(emp.employmentType)}</div>
                    <div className="col-span-1">
                      <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', emp.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-400')} />
                        {emp.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {(certStatus === 'expired' || certStatus === 'urgent') && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {certStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {emp._count.documents > 0 && <FileText className="w-4 h-4 text-slate-300" />}
                      <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-slate-400 text-left">
        {filtered.length} עובדים מתוך {initialEmployees.length}
      </div>
    </div>
  )
}
