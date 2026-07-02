'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Cloud, Thermometer, Wind, Users, Mic, MicOff, Save,
  Lock, Check, ChevronLeft, ChevronRight, RotateCcw, AlertTriangle,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

type Employee = { id: string; firstName: string; lastName: string; photoUrl: string | null; role: string | null }
type Project = { id: string; name: string; address: string | null }
type LogData = {
  id?: string; logDate?: Date; temperature?: number | null; weatherStatus?: string | null
  windSpeed?: number | null; workDescription?: string | null; incidents?: string | null; status?: string
  attendance?: { employeeId: string }[]
}

type Step = 'env' | 'attendance' | 'report' | 'sign'

const STEPS: { id: Step; label: string }[] = [
  { id: 'env', label: 'סביבה' },
  { id: 'attendance', label: 'נוכחות' },
  { id: 'report', label: 'דיווח' },
  { id: 'sign', label: 'חתימה' },
]

const WEATHER_OPTIONS = ['☀️ בהיר', '⛅ מעונן חלקית', '☁️ מעונן', '🌧️ גשום', '⛈️ סערה', '💨 רוח חזקה', '🌫️ ערפל', '🌡️ חם מאוד']

export default function DailyLogClient({
  project, employees, log, yesterdayAttendance,
}: {
  project: Project
  employees: Employee[]
  log: LogData | null
  yesterdayAttendance: string[]
}) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const isLocked = log?.status === 'LOCKED'

  const [step, setStep] = useState<Step>('env')
  const [logDate, setLogDate] = useState(log?.logDate ? new Date(log.logDate).toISOString().split('T')[0] : today)
  const [temperature, setTemperature] = useState(String(log?.temperature ?? ''))
  const [weatherStatus, setWeatherStatus] = useState(log?.weatherStatus ?? '')
  const [windSpeed, setWindSpeed] = useState(String(log?.windSpeed ?? ''))
  const [attendance, setAttendance] = useState<Set<string>>(
    new Set(log?.attendance?.map(a => a.employeeId) ?? [])
  )
  const [workDescription, setWorkDescription] = useState(log?.workDescription ?? '')
  const [incidents, setIncidents] = useState(log?.incidents ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signing, setSigning] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)

  // Auto-fetch weather on mount for new logs
  useEffect(() => {
    if (!log && !temperature) fetchWeather()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchWeather() {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      )
      const { latitude: lat, longitude: lon } = pos.coords
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`
      )
      const d = await r.json()
      if (d.current) {
        setTemperature(String(Math.round(d.current.temperature_2m)))
        setWindSpeed(String(Math.round(d.current.wind_speed_10m)))
        const code = d.current.weather_code
        setWeatherStatus(weatherCodeToLabel(code))
      }
    } catch { /* geolocation denied or API error — user fills manually */ }
  }

  function weatherCodeToLabel(code: number): string {
    if (code === 0) return '☀️ בהיר'
    if (code <= 2) return '⛅ מעונן חלקית'
    if (code <= 3) return '☁️ מעונן'
    if (code <= 67) return '🌧️ גשום'
    if (code >= 95) return '⛈️ סערה'
    return '☁️ מעונן'
  }

  function toggleAttendance(id: string) {
    if (isLocked) return
    setAttendance(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function copyYesterday() {
    setAttendance(new Set(yesterdayAttendance.filter(id => employees.some(e => e.id === id))))
  }

  async function save(lock = false) {
    setSaving(true)
    const body = {
      logDate: new Date(logDate),
      temperature: temperature ? parseFloat(temperature) : null,
      weatherStatus: weatherStatus || null,
      windSpeed: windSpeed ? parseFloat(windSpeed) : null,
      workDescription: workDescription || null,
      incidents: incidents || null,
      attendanceIds: Array.from(attendance),
      ...(lock ? { status: 'LOCKED', signatureUrl: signatureData } : {}),
    }

    const url = log?.id ? `/api/logs/${log.id}` : `/api/projects/${project.id}/logs`
    const method = log?.id ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const saved = await res.json()
      if (lock) {
        router.push(`/projects/${project.id}`)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        if (!log?.id) router.replace(`/projects/${project.id}/logs/${saved.id}`)
      }
    }
    setSaving(false)
  }

  // Signature pad
  const startSign = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current; if (!canvas) return
    setSigning(true)
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    canvas.onpointermove = (ev) => {
      if (!signing) return
      ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top)
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.lineCap = 'round'
      ctx.stroke()
    }
    canvas.onpointerup = () => {
      setSigning(false)
      setSignatureData(canvas.toDataURL())
      canvas.onpointermove = null; canvas.onpointerup = null
    }
  }, [signing])

  function clearSign() {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData(null)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)
        // Without a speech API key, we simulate: just append a note
        setTimeout(() => {
          setWorkDescription(prev => prev + (prev ? '\n' : '') + '[הקלטה קולית — יש להוסיף שירות Speech-to-Text]')
          setTranscribing(false)
        }, 1500)
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch { alert('לא ניתן לגשת למיקרופון') }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
  }

  const stepIdx = STEPS.findIndex(s => s.id === step)
  const canNext = stepIdx < STEPS.length - 1
  const canPrev = stepIdx > 0

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <ArrowRight className="w-4 h-4" />{project.name}
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-slate-900">יומן עבודה</h1>
        {isLocked
          ? <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full"><Lock className="w-3 h-3" />נעול</span>
          : (
            <div className="flex items-center gap-2">
              {!log?.id && (
                <div>
                  <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none" />
                </div>
              )}
              <button onClick={() => save()} disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50">
                {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור'}
              </button>
            </div>
          )}
      </div>

      {/* Step nav */}
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setStep(s.id)}
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
              step === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* ─── Step: Environment ─── */}
      {step === 'env' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-slate-800 text-sm flex items-center gap-1.5"><Cloud className="w-4 h-4 text-blue-500" />מזג אוויר</h2>
              <button onClick={fetchWeather} className="text-xs text-blue-600 hover:underline">רענן אוטומטי</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Thermometer className="w-3 h-3" />טמפרטורה (°C)</label>
                <input type="number" value={temperature} onChange={e => setTemperature(e.target.value)} disabled={isLocked}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="25" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Wind className="w-3 h-3" />רוח (km/h)</label>
                <input type="number" value={windSpeed} onChange={e => setWindSpeed(e.target.value)} disabled={isLocked}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="15" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-2 block">תנאי מזג אוויר</label>
              <div className="flex flex-wrap gap-2">
                {WEATHER_OPTIONS.map(w => (
                  <button key={w} onClick={() => !isLocked && setWeatherStatus(w)}
                    className={cn('text-xs px-3 py-1.5 rounded-full border transition-all',
                      weatherStatus === w ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300')}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step: Attendance ─── */}
      {step === 'attendance' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              {attendance.size} מתוך {employees.length} עובדים נוכחים
            </span>
            {!isLocked && (
              <button onClick={copyYesterday} className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100">
                <RotateCcw className="w-3.5 h-3.5" />העתק מאתמול
              </button>
            )}
          </div>

          {employees.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-10 text-center text-sm text-slate-400">
              אין עובדים משויכים לפרויקט.{' '}
              <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline">הוסף עובדים לפרויקט</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {employees.map(emp => {
                const present = attendance.has(emp.id)
                return (
                  <button key={emp.id} onClick={() => toggleAttendance(emp.id)}
                    className={cn('flex flex-col items-center p-2 rounded-xl border-2 transition-all text-center',
                      present ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300',
                      isLocked && 'cursor-default')}>
                    <div className="relative mb-1">
                      {emp.photoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={emp.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                        : <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">{getInitials(emp.firstName, emp.lastName)}</div>
                      }
                      {present && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-800 leading-tight">{emp.firstName}</span>
                    <span className="text-xs text-slate-500 leading-tight">{emp.lastName}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Step: Report ─── */}
      {step === 'report' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">עבודות שבוצעו היום</label>
            <div className="relative">
              <textarea value={workDescription} onChange={e => setWorkDescription(e.target.value)}
                disabled={isLocked} rows={5} placeholder="תאר את העבודות שבוצעו..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              {!isLocked && (
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={cn('absolute bottom-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    recording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                  {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              {transcribing && <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center text-xs text-slate-500">מתמלל...</div>}
            </div>
            <p className="text-xs text-slate-400 mt-1">לחץ על המיקרופון להקלטה קולית</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />אירועים חריגים / עיכובים
            </label>
            <textarea value={incidents} onChange={e => setIncidents(e.target.value)}
              disabled={isLocked} rows={3} placeholder="ביקורי פיקוח, תקלות, עיכובי חומרים..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
      )}

      {/* ─── Step: Sign ─── */}
      {step === 'sign' && (
        <div className="space-y-4">
          {isLocked ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">היומן נעול וחתום.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">חתימת מנהל עבודה</label>
                <button onClick={clearSign} className="text-xs text-slate-400 hover:text-red-500">נקה</button>
              </div>
              <canvas ref={canvasRef} width={500} height={150} onPointerDown={startSign}
                className="w-full border-2 border-dashed border-slate-300 rounded-lg cursor-crosshair touch-none bg-slate-50" />
              <p className="text-xs text-slate-400 mt-2 text-center">חתום עם האצבע או העכבר</p>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 font-medium mb-1">⚠️ שים לב — נעילת היומן</p>
                <p className="text-xs text-amber-600">לאחר הנעילה לא ניתן לערוך את היומן. פעולה זו מתועדת במערכת.</p>
              </div>

              <button onClick={() => save(true)} disabled={saving || !signatureData}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50">
                <Lock className="w-4 h-4" />{saving ? 'נועל...' : 'חתום ונעל את היומן'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-2 max-w-2xl mx-auto">
        <button onClick={() => setStep(STEPS[stepIdx - 1]?.id)} disabled={!canPrev}
          className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />הקודם
        </button>
        <div className="flex-1 flex justify-center items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className={cn('w-2 h-2 rounded-full transition-all', i === stepIdx ? 'bg-blue-600' : 'bg-slate-200')} />
          ))}
        </div>
        {canNext ? (
          <button onClick={() => setStep(STEPS[stepIdx + 1].id)}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            הבא<ChevronLeft className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
