import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeadDocument = HydratedDocument<Lead>;

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  LOST = 'Lost',
  CLOSED = 'Closed',
}

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop({ required: true, trim: true, index: true })
  phone: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(LeadStatus),
    default: LeadStatus.NEW,
    index: true,
  })
  status: LeadStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

// Compound index for status filtering and date sorting
LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ createdAt: -1 });
