export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  const logs = await prisma.dailyLog.findMany({
    where: { projectId },
    orderBy: { logDate: 'desc' },
    include: { _count: { select: { attendance: true } } },
  })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  const { attendanceIds, ...data } = await req.json()

  const log = await prisma.dailyLog.upsert({
    where: { projectId_logDate: { projectId, logDate: data.logDate } },
    update: data,
    create: { projectId, ...data },
  })

  if (attendanceIds) {
    await prisma.dailyAttendance.deleteMany({ where: { logId: log.id } })
    if (attendanceIds.length > 0) {
      await prisma.dailyAttendance.createMany({
        data: attendanceIds.map((employeeId: string) => ({ logId: log.id, employeeId })),
        skipDuplicates: true,
      })
    }
  }

  return NextResponse.json(log)
}
