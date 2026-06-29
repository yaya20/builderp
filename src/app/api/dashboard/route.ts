export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    activeCount,
    inactiveCount,
    expiringCerts,
    urgentCerts,
    birthdaysThisMonth,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.employee.count({ where: { status: 'INACTIVE' } }),
    prisma.certification.findMany({
      where: { expiryDate: { gte: today, lte: in30 } },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { expiryDate: 'asc' },
    }),
    prisma.certification.findMany({
      where: { expiryDate: { gte: today, lte: in7 } },
      include: { employee: { select: { firstName: true, lastName: true } } },
    }),
    prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        birthDate: { not: null },
      },
      select: { firstName: true, lastName: true, birthDate: true },
    }),
  ])

  const thisMonth = today.getMonth()
  const birthdays = birthdaysThisMonth.filter(
    (e: { firstName: string; lastName: string; birthDate: Date | null }) =>
      e.birthDate && new Date(e.birthDate).getMonth() === thisMonth
  )

  return NextResponse.json({
    activeCount,
    inactiveCount,
    expiringCerts,
    urgentCerts,
    birthdays,
  })
}

