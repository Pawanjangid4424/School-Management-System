import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create or update tenant
  const oldTenant = await prisma.tenant.findUnique({
    where: { school_code: 'MDA001' },
  });

  let tenant;
  if (oldTenant) {
    tenant = await prisma.tenant.update({
      where: { id: oldTenant.id },
      data: { school_code: 'MDA' },
    });
  } else {
    tenant = await prisma.tenant.upsert({
      where: { school_code: 'MDA' },
      update: { school_code: 'MDA' },
      create: {
        school_name: 'Marudhar Defence Academy',
        school_code: 'MDA',
        domain: 'mda.edu',
        mail_provider: 'google',
      },
    });
  }

  console.log(`Tenant created/updated: ${tenant.school_name} (${tenant.school_code})`);

  // 2. Create Admin User
  const adminEmail = 'admin@school.com';
  const hashedPassword = await bcrypt.hash('AdminPass123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { current_email: adminEmail },
    update: {
      password_hash: hashedPassword,
      tenant_id: tenant.id,
    },
    create: {
      tenant_id: tenant.id,
      role: 'ADMIN',
      current_email: adminEmail,
      current_username: 'admin',
      password_hash: hashedPassword,
      status: 'ACTIVE',
    },
  });

  await prisma.staffProfile.upsert({
    where: { user_id: adminUser.id },
    update: { tenant_id: tenant.id },
    create: {
      user_id: adminUser.id,
      tenant_id: tenant.id,
      staff_id: '100',
      first_name: 'System',
      last_name: 'Admin',
      designation: 'Principal / Super Admin',
      department: 'Administration',
      joining_date: new Date('2024-01-01'),
    },
  });

  // 2b. Create Sample Teacher User
  const teacherEmail = 'teacher@school.com';
  const hashedTeacherPass = await bcrypt.hash('TeacherPass123!', 10);

  const teacherUser = await prisma.user.upsert({
    where: { current_email: teacherEmail },
    update: {
      password_hash: hashedTeacherPass,
      tenant_id: tenant.id,
    },
    create: {
      tenant_id: tenant.id,
      role: 'TEACHER',
      current_email: teacherEmail,
      current_username: 'teacher1',
      password_hash: hashedTeacherPass,
      status: 'ACTIVE',
    },
  });

  await prisma.staffProfile.upsert({
    where: { user_id: teacherUser.id },
    update: { tenant_id: tenant.id },
    create: {
      user_id: teacherUser.id,
      tenant_id: tenant.id,
      staff_id: '101',
      first_name: 'Sarah',
      last_name: 'Jenkins',
      designation: 'Senior Mathematics Teacher',
      department: 'Mathematics',
      joining_date: new Date('2024-01-01'),
    },
  });

  // 3. Create Sample Test Students (including siblings Eleanor & Leo Vance)
  const defaultStudentPass = await bcrypt.hash('StudentPass123!', 10);

  const sampleStudents = [
    {
      firstName: 'Eleanor',
      lastName: 'Vance',
      code: '26MDA100042',
      class: '10',
      section: 'A',
      rollNo: 42,
      admissionNo: 'ADM-2026-M1042',
      email: 'eleanor.vance@mda.edu',
      username: 'eleanor.26MDA100042',
    },
    {
      firstName: 'Leo',
      lastName: 'Vance',
      code: '26MDA060015',
      class: '6',
      section: 'B',
      rollNo: 15,
      admissionNo: 'ADM-2026-M1015',
      email: 'leo.vance@mda.edu',
      username: 'leo.26MDA060015',
    },
    {
      firstName: 'Pawan',
      lastName: 'Sharma',
      code: '26MDA100021',
      class: '10',
      section: 'A',
      rollNo: 21,
      admissionNo: 'ADM-2026-M1021',
      email: 'pawan.sharma@mda.edu',
      username: 'pawan.26MDA100021',
    },
    {
      firstName: 'Anita',
      lastName: 'Roy',
      code: '26MDA11S0008',
      class: '11',
      section: 'A',
      stream: 'SCIENCE',
      rollNo: 8,
      admissionNo: 'ADM-2026-M1008',
      email: 'anita.roy@mda.edu',
      username: 'anita.26MDA11S0008',
    },
  ];

  for (const s of sampleStudents) {
    const user = await prisma.user.upsert({
      where: { current_email: s.email },
      update: { tenant_id: tenant.id },
      create: {
        tenant_id: tenant.id,
        role: 'STUDENT',
        current_email: s.email,
        current_username: s.username,
        password_hash: defaultStudentPass,
        status: 'ACTIVE',
      },
    });

    await prisma.studentProfile.upsert({
      where: { user_id: user.id },
      update: {
        current_class: s.class,
        current_section: s.section,
        current_student_code: s.code,
      },
      create: {
        user_id: user.id,
        tenant_id: tenant.id,
        permanent_admission_no: s.admissionNo,
        current_student_code: s.code,
        current_class: s.class,
        current_section: s.section,
        stream: s.stream || null,
        roll_no: s.rollNo,
        admission_year: 2026,
        first_name: s.firstName,
        last_name: s.lastName,
        status: 'ACTIVE',
      },
    });
  }

  console.log(`Seeded ${sampleStudents.length} sample students successfully.`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
