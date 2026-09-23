import { IsEnum, IsNotEmpty } from 'class-validator';
import { LeadStatus } from '../schemas/lead.schema.js';

export class UpdateLeadStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(LeadStatus, {
    message: `Status must be one of: ${Object.values(LeadStatus).join(', ')}`,
  })
  status: LeadStatus;
}
