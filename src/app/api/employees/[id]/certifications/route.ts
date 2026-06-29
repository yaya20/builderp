export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const certs = await prisma.certification.findMany({
    where: { employeeId: id },
    orderBy: { expiryDate: 'asc' },
  })
  return NextResponse.json(certs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const cert = await prisma.certification.create({ data: { ...body, employeeId: id } })
  return NextResponse.json(cert, { status: 201 })
}