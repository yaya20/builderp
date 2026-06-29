export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const records = await prisma.attendance.findMany({
    where: {
      employeeId: id,
      ...(from || to ? {
        workDate: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
    },
    orderBy: { workDate: 'desc' },
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const record = await prisma.attendance.create({
    data: { ...body, employeeId: id, workDate: new Date(body.workDate) },
  })
  return NextResponse.json(record, { status: 201 })
}