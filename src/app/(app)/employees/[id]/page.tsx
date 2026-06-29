export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EmployeeCard from './EmployeeCard'

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      certifications: { orderBy: { expiryDate: 'asc' } },
      documents: { where: { isCurrent: true }, orderBy: { createdAt: 'desc' } },
      attendances: { orderBy: { workDate: 'desc' }, take: 50 },
      skills: true,
      manpowerCompany: true,
      manager: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!employee) notFound()

  return <EmployeeCard employee={employee} />
}