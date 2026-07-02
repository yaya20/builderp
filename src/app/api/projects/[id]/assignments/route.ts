export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  const { employeeId, siteRole } = await req.json()
  const assignment = await prisma.projectAssignment.upsert({
    where: { projectId_employeeId: { projectId, employeeId } },
    update: { siteRole },
    create: { projectId, employeeId, siteRole },
    include: { employee: { select: { id: true, firstName: true, lastName: true, photoUrl: true, role: true, mobile: true } } },
  })
  return NextResponse.json(assignment)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params
  const { employeeId } = await req.json()
  await prisma.projectAssignment.delete({
    where: { projectId_employeeId: { projectId, employeeId } },
  })
  return NextResponse.json({ ok: true })
}
