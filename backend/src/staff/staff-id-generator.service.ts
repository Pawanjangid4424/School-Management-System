import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GenerateStaffIdInput {
  firstName: string;
  staffSequenceNumber: number;
  tenantId: string;
}

export interface StaffIdResult {
  staffId: string;
  username: string;
  email: string;
}

@Injectable()
export class StaffIdGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a permanent Staff ID, Username, and Email.
   * Format: staffId = sequence number (e.g. "101")
   * Username: firstName.staffId (e.g. ravindra.101)
   * Email: username@domain
   */
  async generate(input: GenerateStaffIdInput): Promise<StaffIdResult> {
    const { firstName, staffSequenceNumber, tenantId } = input;

    // 1. Validation
    if (!firstName || firstName.trim().length === 0) {
      throw new BadRequestException('First name is required for Staff ID generation');
    }

    if (staffSequenceNumber === undefined || staffSequenceNumber === null || staffSequenceNumber < 1) {
      throw new BadRequestException('Invalid staff sequence number: Must be greater than 0');
    }

    // 2. Fetch tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // 3. Format Staff ID
    const staffId = String(staffSequenceNumber);

    // 4. Clean First Name
    const cleanFirstName = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = tenant.domain || 'stjude.edu';

    // 5. Handle Name Collisions
    let candidateUsername = `${cleanFirstName}.${staffId}`;
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
        break; // Unique username & email found
      }

      suffixCounter++;
      candidateUsername = `${cleanFirstName}${suffixCounter}.${staffId}`;
      candidateEmail = `${candidateUsername}@${domain}`;
    }

    return {
      staffId,
      username: candidateUsername,
      email: candidateEmail,
    };
  }
}
