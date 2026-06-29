export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const docs = await prisma.document.findMany({
    where: { employeeId: id, isCurrent: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { docType, title, fileUrl, description } = await req.json()

  // Mark previous version as not current
  await prisma.document.updateMany({
    where: { employeeId: id, docType, isCurrent: true },
    data: { isCurrent: false },
  })

  // Get version number
  const count = await prisma.document.count({ where: { employeeId: id, docType } })

  const doc = await prisma.document.create({
    data: { employeeId: id, docType, title, fileUrl, description, version: count + 1 },
  })
  return NextResponse.json(doc)
}
