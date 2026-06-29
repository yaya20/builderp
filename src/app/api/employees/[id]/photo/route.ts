export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { photoUrl } = await req.json()
  const employee = await prisma.employee.update({ where: { id }, data: { photoUrl } })
  return NextResponse.json({ photoUrl: employee.photoUrl })
}
