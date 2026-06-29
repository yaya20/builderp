export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import EmployeesClient from './EmployeesClient'

async function getDashboardData() {
  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thisMonth = today.getMonth()

  const [activeCount, inactiveCount, expiringCerts, urgentCerts, allEmployees] = await Promise.all([
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.employee.count({ where: { status: 'INACTIVE' } }),
    prisma.certification.count({ where: { expiryDate: { gte: today, lte: in30 } } }),
    prisma.certification.findMany({
      where: { expiryDate: { gte: today, lte: in7 } },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 5,
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE', birthDate: { not: null } },
      select: { firstName: true, lastName: true, birthDate: true },
    }),
  ])

  const birthdays = allEmployees.filter(
    (e: { birthDate: Date | null; firstName: string; lastName: string }) =>
      e.birthDate && new Date(e.birthDate).getMonth() === thisMonth
  )

  return { activeCount, inactiveCount, expiringCerts, urgentCerts, birthdays }
}

async function getEmployees() {
  return prisma.employee.findMany({
    include: {
      certifications: { select: { expiryDate: true, certType: true } },
      _count: { select: { documents: true } },
    },
    orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
  })
}

export default async function EmployeesPage() {
  const [dashboard, employees] = await Promise.all([getDashboardData(), getEmployees()])

  return <EmployeesClient dashboard={dashboard} initialEmployees={employees} />
}

