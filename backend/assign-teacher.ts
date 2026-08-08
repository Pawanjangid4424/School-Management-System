import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const t = await prisma.user.findFirst({
    where: { current_username: 'teacher1' },
    include: { staff_profile: true },
  });

  if (!t || !t.staff_profile) {
    console.log('Teacher not found');
    return;
  }

  const classSec = await prisma.classSection.upsert({
    where: { id: 'test-10-A' },
    update: { class_teacher_id: t.staff_profile.id },
    create: {
      id: 'test-10-A',
      tenant_id: t.tenant_id,
      class_number: 10,
      section: 'A',
      class_teacher_id: t.staff_profile.id,
    },
  });
  console.log('Correctly assigned staff_profile.id to class:', classSec);

  // Assign students to this class section as well so attendance can be marked
  await prisma.studentProfile.updateMany({
    where: { tenant_id: t.tenant_id, current_class: '10', current_section: 'A' },
    data: { current_class: '10', current_section: 'A' } // Just ensuring they match
  });
}

run().finally(() => prisma.$disconnect());
