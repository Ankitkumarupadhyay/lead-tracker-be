import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LeadStatus } from '../schemas/lead.schema.js';

export class CreateLeadDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Phone must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/, {
    message: 'Please provide a valid phone number (e.g., +1234567890 or 9876543210)',
  })
  phone: string;

  @IsOptional()
  @IsEnum(LeadStatus, {
    message: `Status must be one of: ${Object.values(LeadStatus).join(', ')}`,
  })
  status?: LeadStatus;
}
