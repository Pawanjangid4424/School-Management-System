import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { RolloverService, PromotionItem } from './rollover.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('rollover')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RolloverController {
  constructor(private readonly rolloverService: RolloverService) {}

  @Post('preview')
  async getRolloverPreview(
    @Request() req,
    @Body() body: { currentYear: number; targetYear: number },
  ) {
    const tenantId = req.user.tenant_id;
    return this.rolloverService.getRolloverPreview(tenantId, body.currentYear, body.targetYear);
  }

  @Post('execute')
  async executeRollover(
    @Request() req,
    @Body()
    body: {
      currentYear: number;
      targetYear: number;
      promotions: PromotionItem[];
    },
  ) {
    const tenantId = req.user.tenant_id;
    return this.rolloverService.executeRollover(
      tenantId,
      body.currentYear,
      body.targetYear,
      body.promotions,
    );
  }

  @Post('undo')
  async undoRollover(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.rolloverService.undoRollover(tenantId);
  }
}
