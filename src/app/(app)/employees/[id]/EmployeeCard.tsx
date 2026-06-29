'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Shield,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  User,
} from 'lucide-react'
import { cn, formatDate, getDaysUntil, getInitials, employmentTypeLabel } from '@/lib/utils'

type Tab = 'attendance' | 'documents' | 'certifications'

type Employee = {
  id: string
  employeeNumber: number
  firstName: string
  lastName: string
  idNumber: string
  birthDate: Date | null
  address: string | null
  mobile: string | null
  phone2: string | null
  email: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  photoUrl: string | null
  status: string
  employmentType: string
  role: string | null
  department: string | null
  startDate: Date | null
  endDate: Date | null
  notes: string | null
  manpowerCompany: { name: string; contactName: string | null; phone: string | null } | null
  manager: { id: string; firstName: string; lastName: string } | null
  skills: { skillName: string }[]
  certifications: {
    id: string
    certType: string
    certNumber: string | null
    issuedDate: Date | null
    expiryDate: Date | null
    issuingBody: string | null
    fileUrl: string | null
  }[]
  documents: {
    id: string
    docType: string
    title: string
    fileUrl: string | null
    version: number
    description: string | null
    createdAt: Date
  }[]
  attendances: {
    id: string
    workDate: Date
    site: string | null
    startTime: string | null
    endTime: string | null
    totalHours: number | null
    overtimeHours: number | null
    notes: string | null
  }[]
}

function CertBadge({ expiryDate }: { expiryDate: Date | null }) {
  if (!expiryDate) return <span className="text-xs text-slate-400">ללא תאריך</span>
  const days = getDaysUntil(expiryDate)
  if (days === null) return null
  if (days < 0)
    return (
      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        פגה!
      </span>
    )
  if (days <= 7)
    return (
      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        ⚠️ {days} ימים
      </span>
    )
  if (days <= 30)
    return (
      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
        {days} ימים
      </span>
    )
  return (
    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      ✓ בתוקף
    </span>
  )
}

export default function EmployeeCard({ employee }: { employee: Employee }) {
  const [activeTab, setActiveTab] = useState<Tab | null>(null)
  const initials = getInitials(employee.firstName, employee.lastName)

  const totalHours = employee.attendances.reduce((s, a) => s + (a.totalHours ?? 0), 0)
  const totalOvertime = employee.attendances.reduce((s, a) => s + (a.overtimeHours ?? 0), 0)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לרשימת העובדים
      </Link>

      <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-5">
        {/* ─── Profile card ─── */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-4">
              {employee.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employee.photoUrl}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="w-20 h-20 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mb-3">
                  {initials}
                </div>
              )}
              <h1 className="text-lg font-bold text-slate-900 text-center">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-sm text-slate-500 text-center">{employee.role ?? '—'}</p>
              <span
                className={cn(
                  'mt-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                  employee.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    employee.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-400'
                  )}
                />
                {employee.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
              </span>
            </div>

            {/* Info rows */}
            <div className="space-y-2 text-sm">
              <InfoRow label="מספר עובד" value={`#${String(employee.employeeNumber).padStart(4, '0')}`} />
              <InfoRow label="ת.ז." value={employee.idNumber} />
              <InfoRow label="סוג העסקה" value={employmentTypeLabel(employee.employmentType)} />
              {employee.department && <InfoRow label="מחלקה" value={employee.department} />}
              {employee.manager && (
                <InfoRow
                  label="מנהל ישיר"
                  value={`${employee.manager.firstName} ${employee.manager.lastName}`}
                />
              )}
              {employee.startDate && (
                <InfoRow label="תחילת עבודה" value={formatDate(employee.startDate)} />
              )}
              {employee.manpowerCompany && (
                <InfoRow label="חברת כוח אדם" value={employee.manpowerCompany.name} />
              )}
            </div>

            {/* Contact */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              {employee.mobile && (
                <a
                  href={`tel:${employee.mobile}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {employee.mobile}
                </a>
              )}
              {employee.email && (
                <a
                  href={`mailto:${employee.email}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {employee.email}
                </a>
              )}
              {employee.birthDate && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(employee.birthDate)}
                </div>
              )}
            </div>

            {/* Skills */}
            {employee.skills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-500 mb-2">מיומנויות</div>
                <div className="flex flex-wrap gap-1">
                  {employee.skills.map((s) => (
                    <span
                      key={s.skillName}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {s.skillName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Emergency contact */}
          {employee.emergencyContact && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
              <div className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                איש קשר לחירום
              </div>
              <div className="text-slate-600">{employee.emergencyContact}</div>
              {employee.emergencyPhone && (
                <a
                  href={`tel:${employee.emergencyPhone}`}
                  className="text-blue-600 hover:underline text-xs"
                >
                  {employee.emergencyPhone}
                </a>
              )}
            </div>
          )}
        </div>

        {/* ─── Tabs ─── */}
        <div className="md:col-span-2 space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2 md:gap-3">
            <TabButton
              active={activeTab === 'attendance'}
              onClick={() => setActiveTab(activeTab === 'attendance' ? null : 'attendance')}
              icon={<Clock className="w-4 h-4" />}
              label="נוכחות"
              count={employee.attendances.length}
            />
            <TabButton
              active={activeTab === 'certifications'}
              onClick={() => setActiveTab(activeTab === 'certifications' ? null : 'certifications')}
              icon={<Shield className="w-4 h-4" />}
              label="הסמכות"
              count={employee.certifications.length}
              hasAlert={employee.certifications.some((c) => {
                const d = getDaysUntil(c.expiryDate)
                return d !== null && d <= 30
              })}
            />
            <TabButton
              active={activeTab === 'documents'}
              onClick={() => setActiveTab(activeTab === 'documents' ? null : 'documents')}
              icon={<FileText className="w-4 h-4" />}
              label="מסמכים"
              count={employee.documents.length}
            />
          </div>

          {/* Tab content */}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-800 text-sm">רישום נוכחות</span>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>סה"כ שעות: <strong className="text-slate-800">{totalHours.toFixed(1)}</strong></span>
                  <span>שעות נוספות: <strong className="text-amber-600">{totalOvertime.toFixed(1)}</strong></span>
                </div>
              </div>
              {employee.attendances.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">אין רשומות נוכחות</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="text-right px-4 py-2 font-medium">תאריך</th>
                      <th className="text-right px-4 py-2 font-medium">אתר</th>
                      <th className="text-right px-4 py-2 font-medium">שעות</th>
                      <th className="text-right px-4 py-2 font-medium">נוספות</th>
                      <th className="text-right px-4 py-2 font-medium">הערות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employee.attendances.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2">{formatDate(a.workDate)}</td>
                        <td className="px-4 py-2 text-slate-500">{a.site ?? '—'}</td>
                        <td className="px-4 py-2">{a.totalHours?.toFixed(1) ?? '—'}</td>
                        <td className="px-4 py-2">
                          {a.overtimeHours ? (
                            <span className="text-amber-600">{a.overtimeHours.toFixed(1)}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-400 text-xs">{a.notes ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'certifications' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-800 text-sm">הסמכות והדרכות</span>
                <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  <Plus className="w-3.5 h-3.5" />
                  הוסף הסמכה
                </button>
              </div>
              {employee.certifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">אין הסמכות רשומות</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {employee.certifications.map((c) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{c.certType}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {c.certNumber && <span>מס׳ {c.certNumber} · </span>}
                          {c.issuingBody && <span>{c.issuingBody} · </span>}
                          {c.issuedDate && <span>הונפקה {formatDate(c.issuedDate)}</span>}
                        </div>
                        {c.expiryDate && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            תפוגה: {formatDate(c.expiryDate)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CertBadge expiryDate={c.expiryDate} />
                        {c.fileUrl && (
                          <a
                            href={c.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            📎 קובץ
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-800 text-sm">מסמכים</span>
                <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  <Plus className="w-3.5 h-3.5" />
                  העלה מסמך
                </button>
              </div>
              {employee.documents.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">אין מסמכים</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {employee.documents.map((d) => (
                    <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{d.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {d.docType} · גרסה {d.version} · הועלה {formatDate(d.createdAt)}
                        </div>
                        {d.description && (
                          <div className="text-xs text-slate-400">{d.description}</div>
                        )}
                      </div>
                      {d.fileUrl ? (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          הורד
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">אין קובץ</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === null && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm">
              בחר לשונית לצפייה בנוכחות, הסמכות או מסמכים
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-slate-400 text-xs flex-shrink-0">{label}</span>
      <span className="text-slate-700 text-xs text-left">{value}</span>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  hasAlert,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
  hasAlert?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-all flex-1 md:flex-none justify-center md:justify-start',
        active
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-700'
      )}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
          )}
        >
          {count}
        </span>
      )}
      {hasAlert && !active && (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
      )}
    </button>
  )
}
