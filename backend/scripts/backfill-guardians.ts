import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Guardian Backfill & Linkage Script ---');

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('No tenant found. Please run seed script first.');
    return;
  }

  // Fetch all active students
  const students = await prisma.studentProfile.findMany({
    where: { tenant_id: tenant.id },
    orderBy: { roll_no: 'asc' },
  });

  console.log(`Found ${students.length} existing students to process for guardian linkage.`);

  const tempPassword = 'ParentPass123!';
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  const logEntries: string[] = [];

  let guardianAccountsCreated = 0;
  let linksCreated = 0;
  let siblingReuses = 0;

  // Process sample guardian emails for existing test students
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    // Sibling grouping demo: Students 0 & 1 share the same guardian email (siblings)
    const guardianEmail =
      i < 2 ? 'sarah.vance.parent@gmail.com' : `parent.student${i + 1}@gmail.com`;
    const guardianName = i < 2 ? 'Sarah Vance' : `Parent of ${student.first_name}`;

    // Sibling detection check
    let parentUser: any = await prisma.user.findUnique({
      where: { current_email: guardianEmail },
      include: { guardian_profile: true },
    });

    let guardianProfile = parentUser?.guardian_profile;

    if (!parentUser) {
      const username = guardianEmail.split('@')[0];
      parentUser = await prisma.user.create({
        data: {
          tenant_id: tenant.id,
          role: 'PARENT',
          current_email: guardianEmail,
          current_username: username,
          password_hash: hashedPassword,
          status: 'ACTIVE',
        },
      });

      guardianProfile = await prisma.guardianProfile.create({
        data: {
          user_id: parentUser.id,
          tenant_id: tenant.id,
          full_name: guardianName,
          relation_to_student: 'MOTHER',
        },
      });

      guardianAccountsCreated++;
      logEntries.push(
        `[CREATED PARENT ACCOUNT] Email: ${guardianEmail} | Username: ${username} | Temp Password: ${tempPassword} | Guardian: ${guardianName}`,
      );
    } else {
      siblingReuses++;
      if (!guardianProfile) {
        guardianProfile = await prisma.guardianProfile.create({
          data: {
            user_id: parentUser.id,
            tenant_id: tenant.id,
            full_name: guardianName,
            relation_to_student: 'MOTHER',
          },
        });
      }
      logEntries.push(
        `[SIBLING DETECTED - REUSED ACCOUNT] Email: ${guardianEmail} | Linked to Sibling Student: ${student.first_name} ${student.last_name} (${student.current_student_code})`,
      );
    }

    // Upsert StudentGuardianLink
    await prisma.studentGuardianLink.upsert({
      where: {
        student_profile_id_guardian_profile_id: {
          student_profile_id: student.id,
          guardian_profile_id: guardianProfile.id,
        },
      },
      update: { is_primary_contact: true },
      create: {
        student_profile_id: student.id,
        guardian_profile_id: guardianProfile.id,
        is_primary_contact: true,
      },
    });

    linksCreated++;
  }

  const summary = `
=== GUARDIAN BACKFILL SUMMARY ===
Total Students Processed: ${students.length}
Guardian User Accounts Created: ${guardianAccountsCreated}
Sibling Account Reuses: ${siblingReuses}
StudentGuardianLink Records: ${linksCreated}
Default Temporary Password for all Parents: ${tempPassword}
=================================
`;

  console.log(summary);
  logEntries.forEach((e) => console.log(e));

  // Write credentials log file
  const logFilePath = path.join(__dirname, 'parent-credentials.log');
  fs.writeFileSync(logFilePath, `${summary}\n` + logEntries.join('\n'));
  console.log(`\nParent credentials saved to file: ${logFilePath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
