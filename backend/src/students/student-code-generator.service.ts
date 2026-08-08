import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GenerateStudentCodeInput {
  admissionYear: number;
  classNumber: number;
  stream?: 'SCIENCE' | 'COMMERCE' | 'ARTS' | string | null;
  rollNumber: number;
  tenantId: string;
  firstName: string;
}

export interface StudentCodeResult {
  studentCode: string;
  username: string;
  email: string;
}

@Injectable()
export class StudentCodeGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a unique student code, username, and email for a student.
   * Format: [YY][SCHOOLCODE][CLASS][STREAM?][ROLL]
   * Username: firstName.code (lowercase, e.g. pawan.26mda11s0008)
   * Email: username@domain
   */
  async generate(input: GenerateStudentCodeInput): Promise<StudentCodeResult> {
    const { admissionYear, classNumber, stream, rollNumber, tenantId, firstName } = input;

    // 1. Validation
    if (!admissionYear || admissionYear < 1900 || admissionYear > 2100) {
      throw new BadRequestException('Invalid admission year');
    }

    if (!classNumber || classNumber < 1 || classNumber > 12) {
      throw new BadRequestException('Invalid class number: Must be between 1 and 12');
    }

    if (rollNumber === undefined || rollNumber === null || rollNumber < 1 || rollNumber > 9999) {
      throw new BadRequestException('Invalid roll number: Must be between 1 and 9999');
    }

    let streamCode = '';
    if (classNumber === 11 || classNumber === 12) {
      if (!stream) {
        throw new BadRequestException('Stream (SCIENCE, COMMERCE, or ARTS) is required for classes 11 and 12');
      }

      const normalizedStream = stream.toUpperCase();
      if (normalizedStream === 'SCIENCE') {
        streamCode = 'S';
      } else if (normalizedStream === 'COMMERCE') {
        streamCode = 'C';
      } else if (normalizedStream === 'ARTS') {
        streamCode = 'A';
      } else {
        throw new BadRequestException('Invalid stream: Must be SCIENCE, COMMERCE, or ARTS');
      }
    }

    // 2. Fetch tenant details for school_code and domain
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // 3. Format components
    const yy = String(admissionYear).slice(-2);
    const schoolCode = tenant.school_code.toUpperCase();
    const paddedClass = String(classNumber).padStart(2, '0');
    const paddedRoll = String(rollNumber).padStart(4, '0');

    // Code: [YY][SCHOOLCODE][CLASS][STREAM?][ROLL]
    const studentCode = `${yy}${schoolCode}${paddedClass}${streamCode}${paddedRoll}`;

    // 4. Clean first name for username/email
    const cleanFirstName = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const codeLower = studentCode.toLowerCase();
    const domain = tenant.domain || 'stjude.edu';

    // 5. Handle Name Collisions
    let candidateUsername = `${cleanFirstName}.${codeLower}`;
    let candidateEmail = `${candidateUsername}@${domain}`;
    let suffixCounter = 1;

    while (true) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          tenant_id: tenantId,
          OR: [
            { current_username: candidateUsername },
            { current_email: candidateEmail },
          ],
        },
      });

      if (!existingUser) {
        break; // Unique username and email found
      }

      suffixCounter++;
      candidateUsername = `${cleanFirstName}${suffixCounter}.${codeLower}`;
      candidateEmail = `${candidateUsername}@${domain}`;
    }

    return {
      studentCode,
      username: candidateUsername,
      email: candidateEmail,
    };
  }
}
