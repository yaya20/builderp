export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      certifications: { orderBy: { expiryDate: 'asc' } },
      documents: { where: { isCurrent: true }, orderBy: { createdAt: 'desc' } },
      attendances: { orderBy: { workDate: 'desc' }, take: 30 },
      skills: true,
      manpowerCompany: true,
      manager: { select: { id: true, firstName: true, lastName: true } },
    },
  })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(employee)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { skills, certifications, documents, attendances, manpowerCompany, manager, reports, _count, ...data } = body
  const employee = await prisma.employee.update({ where: { id }, data })
  return NextResponse.json(employee)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.employee.update({ where: { id }, data: { status: 'INACTIVE' } })
  return NextResponse.json({ ok: true })
}