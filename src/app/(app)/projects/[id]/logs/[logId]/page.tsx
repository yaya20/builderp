import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import DailyLogClient from './DailyLogClient'

export const dynamic = 'force-dynamic'

export default async function DailyLogPage({ params }: { params: Promise<{ id: string; logId: string }> }) {
  const { id: projectId, logId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      assignments: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, photoUrl: true, role: true },
          },
        },
      },
    },
  })
  if (!project) notFound()

  let log = null
  if (logId !== 'new') {
    log = await prisma.dailyLog.findUnique({
      where: { id: logId },
      include: {
        attendance: { select: { employeeId: true } },
      },
    })
    if (!log) notFound()
  }

  // Yesterday's attendance for the copy-from-yesterday feature
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayLog = await prisma.dailyLog.findFirst({
    where: { projectId, logDate: { gte: yesterday } },
    include: { attendance: { select: { employeeId: true } } },
    orderBy: { logDate: 'desc' },
  })

  return (
    <DailyLogClient
      project={{ id: project.id, name: project.name, address: project.address }}
      employees={project.assignments.map(a => a.employee)}
      log={log}
      yesterdayAttendance={yesterdayLog?.attendance.map(a => a.employeeId) ?? []}
    />
  )
}
