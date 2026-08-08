import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import {
  TransportService,
  CreateVehicleDto,
  CreateRouteDto,
  AssignStudentTransportDto,
} from './transport.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('transport')
@UseGuards(JwtAuthGuard)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // --- VEHICLES ---

  @Get('vehicles')
  async getVehicles(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.transportService.getVehicles(tenantId);
  }

  @Post('vehicles')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createVehicle(@Request() req, @Body() body: CreateVehicleDto) {
    const tenantId = req.user.tenant_id;
    return this.transportService.createVehicle(tenantId, body);
  }

  // --- ROUTES ---

  @Get('routes')
  async getRoutes(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.transportService.getRoutes(tenantId);
  }

  @Post('routes')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createRoute(@Request() req, @Body() body: CreateRouteDto) {
    const tenantId = req.user.tenant_id;
    return this.transportService.createRoute(tenantId, body);
  }

  @Delete('routes/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteRoute(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    return this.transportService.deleteRoute(tenantId, id);
  }

  @Get('routes/:id')
  async getRouteById(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    return this.transportService.getRouteById(tenantId, id);
  }

  @Get('routes/:id/roster')
  async getRouteRoster(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    return this.transportService.getRouteRoster(tenantId, id);
  }

  // --- ASSIGNMENTS & STUDENT LOOKUP ---

  @Post('assignments')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async assignStudent(@Request() req, @Body() body: AssignStudentTransportDto) {
    const tenantId = req.user.tenant_id;
    return this.transportService.assignStudent(tenantId, body);
  }

  @Get('students/:studentProfileId')
  async getStudentTransportInfo(
    @Request() req,
    @Param('studentProfileId') studentProfileId: string,
  ) {
    return this.transportService.getStudentTransportInfo(req.user, studentProfileId);
  }
}
