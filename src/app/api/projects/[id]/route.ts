export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { employee: { select: { id: true, firstName: true, lastName: true, photoUrl: true, role: true, mobile: true } } },
      },
      dailyLogs: { orderBy: { logDate: 'desc' }, take: 30 },
      _count: { select: { assignments: true, dailyLogs: true } },
    },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { assignments, dailyLogs, _count, ...data } = await req.json()
  const project = await prisma.project.update({ where: { id }, data })
  return NextResponse.json(project)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.project.update({ where: { id }, data: { status: 'CANCELLED' } })
  return NextResponse.json({ ok: true })
}
