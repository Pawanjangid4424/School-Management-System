import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  FeesService,
  CreateFeeHeadDto,
  CreateFeeStructureDto,
  RecordPaymentDto,
} from './fees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('fees')
@UseGuards(JwtAuthGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get('dashboard-summary')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getDashboardSummary(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.feesService.getDashboardSummary(tenantId);
  }

  // --- FEE HEADS & STRUCTURES ---

  @Get('heads')
  async getFeeHeads(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.feesService.getFeeHeads(tenantId);
  }

  @Post('heads')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createFeeHead(@Request() req, @Body() body: CreateFeeHeadDto) {
    const tenantId = req.user.tenant_id;
    return this.feesService.createFeeHead(tenantId, body);
  }

  @Get('structure')
  async getFeeStructures(
    @Request() req,
    @Query('classNumber') classNumber?: number,
    @Query('academicYear') academicYear?: number,
  ) {
    const tenantId = req.user.tenant_id;
    return this.feesService.getFeeStructures(tenantId, classNumber, academicYear);
  }

  @Post('structure')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createFeeStructure(@Request() req, @Body() body: CreateFeeStructureDto) {
    const tenantId = req.user.tenant_id;
    return this.feesService.createFeeStructure(tenantId, body);
  }

  // --- INVOICES & PAYMENTS ---

  @Post('generate-invoices')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async generateInvoices(
    @Request() req,
    @Body() body: { classNumber: number; academicYear: number; dueDate: string },
  ) {
    const tenantId = req.user.tenant_id;
    return this.feesService.generateInvoices(
      tenantId,
      body.classNumber,
      body.academicYear,
      body.dueDate,
    );
  }

  @Get('invoices')
  async getInvoices(
    @Request() req,
    @Query('classNumber') classNumber?: number,
    @Query('status') status?: string,
    @Query('studentProfileId') studentProfileId?: string,
  ) {
    const tenantId = req.user.tenant_id;
    return this.feesService.getInvoices(tenantId, classNumber, status, studentProfileId);
  }

  @Get('defaulters')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getDefaulters(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.feesService.getDefaulters(tenantId);
  }

  @Get('invoices/:id')
  async getInvoiceById(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    return this.feesService.getInvoiceById(tenantId, id);
  }

  @Post('invoices/:id/record-payment')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async recordPayment(
    @Request() req,
    @Param('id') invoiceId: string,
    @Body() body: { amountPaid: number; paymentMethod: any; notes?: string },
  ) {
    const tenantId = req.user.tenant_id;
    const staffUserId = req.user.id;
    return this.feesService.recordPayment(tenantId, staffUserId, {
      invoiceId,
      amountPaid: body.amountPaid,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
    });
  }

  @Get('invoices/:id/payments')
  async getPaymentAuditTrail(@Request() req, @Param('id') invoiceId: string) {
    const tenantId = req.user.tenant_id;
    const invoice = await this.feesService.getInvoiceById(tenantId, invoiceId);
    return invoice.payments;
  }

  @Get('payments/recent')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getRecentPayments(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.feesService.getRecentPayments(tenantId);
  }
}
