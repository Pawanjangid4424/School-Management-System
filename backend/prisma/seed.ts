import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring Tenant and Super Admin exist...');

  // 1. Create or update tenant
  const tenant = await prisma.tenant.upsert({
    where: { school_code: 'MDA' },
    update: { school_code: 'MDA' },
    create: {
      school_name: 'Marudhar Defence Academy',
      school_code: 'MDA',
      domain: 'mda.edu',
      mail_provider: 'google',
    },
  });

  console.log(`Tenant ready: ${tenant.school_name} (${tenant.school_code})`);

  // 2. Create Super Admin User
  const adminEmail = 'admin@school.com';
  const hashedPassword = await bcrypt.hash('AdminPass123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { current_email: adminEmail },
    update: {
      password_hash: hashedPassword,
      tenant_id: tenant.id,
      status: 'ACTIVE',
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

  console.log('Super Admin account ready.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
