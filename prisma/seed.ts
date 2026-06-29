import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const employees = [
    { firstName: 'יוסי', lastName: 'כהן', idNumber: '012345678', mobile: '050-1234567', role: 'טפסן', employmentType: 'COMPANY' as const, status: 'ACTIVE' as const, birthDate: new Date('1985-07-15'), startDate: new Date('2021-03-01') },
    { firstName: 'מוחמד', lastName: 'עלי', idNumber: '023456789', mobile: '052-2345678', role: 'ברזלן', employmentType: 'MANPOWER' as const, status: 'ACTIVE' as const, startDate: new Date('2022-06-15') },
    { firstName: 'רחל', lastName: 'מזרחי', idNumber: '034567890', mobile: '054-3456789', email: 'rachel@builderp.co.il', role: 'מנהלת עבודה', department: 'ניהול', employmentType: 'COMPANY' as const, status: 'ACTIVE' as const, birthDate: new Date('1979-07-02'), startDate: new Date('2018-01-01') },
    { firstName: 'אחמד', lastName: 'חמיס', idNumber: '045678901', mobile: '050-4567890', role: 'מנופאי', employmentType: 'CONTRACTOR' as const, status: 'INACTIVE' as const, startDate: new Date('2020-05-01'), endDate: new Date('2024-12-31') },
    { firstName: 'דוד', lastName: 'לוי', idNumber: '056789012', mobile: '053-5678901', role: 'אינסטלטור', employmentType: 'COMPANY' as const, status: 'ACTIVE' as const, birthDate: new Date('1990-07-03'), startDate: new Date('2023-02-01') },
  ]

  for (const emp of employees) {
    const created = await prisma.employee.upsert({ where: { idNumber: emp.idNumber }, update: {}, create: emp })
    if (emp.firstName === 'יוסי') {
      await prisma.certification.deleteMany({ where: { employeeId: created.id } })
      await prisma.certification.createMany({ data: [
        { employeeId: created.id, certType: 'עבודה בגובה', certNumber: 'WH-2891', issuingBody: 'משרד העבודה', issuedDate: new Date('2023-07-04'), expiryDate: new Date(Date.now() + 7 * 86400000) },
        { employeeId: created.id, certType: 'הדרכת בטיחות כללית', certNumber: 'SF-1122', issuingBody: 'מכון הבטיחות', issuedDate: new Date('2024-12-15'), expiryDate: new Date('2026-12-15') },
      ]})
      await prisma.employeeSkill.createMany({ skipDuplicates: true, data: [
        { employeeId: created.id, skillName: 'טפסנות' },
        { employeeId: created.id, skillName: 'ברזלנות' },
        { employeeId: created.id, skillName: 'עבודה בגובה' },
      ]})
      await prisma.attendance.createMany({ data: [
        { employeeId: created.id, workDate: new Date('2026-06-25'), site: 'דיזנגוף 254', startTime: '07:00', endTime: '16:00', totalHours: 9, overtimeHours: 1 },
        { employeeId: created.id, workDate: new Date('2026-06-26'), site: 'דיזנגוף 254', startTime: '07:00', endTime: '15:00', totalHours: 8, overtimeHours: 0 },
      ]})
    }
  }
  console.log('✅ Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())