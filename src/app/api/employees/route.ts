export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status')
  const type = searchParams.get('type')

  const employees = await prisma.employee.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { idNumber: { contains: q } },
                { mobile: { contains: q } },
              ],
            }
          : {},
        status ? { status: status as 'ACTIVE' | 'INACTIVE' } : {},
        type ? { employmentType: type as 'COMPANY' | 'CONTRACTOR' | 'MANPOWER' } : {},
      ],
    },
    include: {
      certifications: { select: { expiryDate: true } },
      _count: { select: { documents: true, certifications: true } },
    },
    orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
  })

  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const employee = await prisma.employee.create({ data: body })
  return NextResponse.json(employee, { status: 201 })
}

