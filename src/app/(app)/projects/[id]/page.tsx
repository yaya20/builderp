import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProjectDetail from './ProjectDetail'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, allEmployees] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, photoUrl: true, role: true, mobile: true, status: true } },
          },
        },
        dailyLogs: {
          orderBy: { logDate: 'desc' },
          take: 60,
          include: { _count: { select: { attendance: true } } },
        },
      },
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, photoUrl: true, role: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
  ])

  if (!project) notFound()
  return <ProjectDetail project={project} allEmployees={allEmployees} />
}
