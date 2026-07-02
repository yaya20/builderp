export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, address: true } },
      attendance: {
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, photoUrl: true, role: true } },
        },
      },
    },
  })
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(log)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { attendanceIds, attendance, project, _count, ...data } = await req.json()

  if (data.status === 'LOCKED') data.lockedAt = new Date()

  const log = await prisma.dailyLog.update({ where: { id }, data })

  if (attendanceIds) {
    await prisma.dailyAttendance.deleteMany({ where: { logId: id } })
    if (attendanceIds.length > 0) {
      await prisma.dailyAttendance.createMany({
        data: attendanceIds.map((employeeId: string) => ({ logId: id, employeeId })),
        skipDuplicates: true,
      })
    }
  }

  return NextResponse.json(log)
}
