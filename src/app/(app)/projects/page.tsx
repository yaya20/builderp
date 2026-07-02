import { prisma } from '@/lib/prisma'
import ProjectsClient from './ProjectsClient'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { assignments: true, dailyLogs: true } } },
  })
  return <ProjectsClient initialProjects={projects} />
}
