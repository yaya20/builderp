export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { assignments: true, dailyLogs: true } },
    },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const project = await prisma.project.create({ data: body })
  return NextResponse.json(project)
}
