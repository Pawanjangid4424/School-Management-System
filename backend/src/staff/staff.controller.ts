import { Controller, Post, Get, Put, Patch, Delete, Body, UseGuards, Request, Param, UnauthorizedException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createStaff(@Request() req, @Body() dto: CreateStaffDto) {
    const tenantId = req.user.tenant_id;
    return this.staffService.createStaff(tenantId, dto);
  }

  @Get()
  async findAll(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.staffService.findAll(tenantId);
  }

  @Get(':id')
  async getStaff(@Param('id') id: string, @Request() req) {
    return this.staffService.getStaff(id, req.user.tenant_id);
  }

  @Put(':id')
  async updateStaff(
    @Param('id') id: string,
    @Body() payload: any,
    @Request() req
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can edit staff');
    }
    return this.staffService.updateStaff(id, req.user.tenant_id, payload);
  }

  @Patch(':id/suspend')
  async suspendStaff(
    @Param('id') id: string,
    @Body() payload: { durationDays: number, reason: string },
    @Request() req
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can suspend staff');
    }
    return this.staffService.suspendStaff(id, req.user.tenant_id, payload.durationDays, payload.reason);
  }

  @Delete(':id')
  async deleteStaff(
    @Param('id') id: string,
    @Request() req
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can delete staff');
    }
    const adminId = req.user.id || req.user.userId || 'admin-id';
    const adminName = req.user.username || req.user.email || 'Admin';
    return this.staffService.deleteStaff(id, req.user.tenant_id, adminId, adminName);
  }
}
