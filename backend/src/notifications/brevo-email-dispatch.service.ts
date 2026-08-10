import { Injectable } from '@nestjs/common';
import { ResendEmailDispatchService } from './resend-email-dispatch.service';

@Injectable()
export class BrevoEmailDispatchService extends ResendEmailDispatchService {}
