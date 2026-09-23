import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument, LeadStatus } from './schemas/lead.schema.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto.js';
import { QueryLeadDto } from './dto/query-lead.dto.js';

export interface PaginatedLeads {
  data: Lead[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  conversionRate: number;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
  ) {}

  /**
   * Helper to escape special characters for safe regex queries
   */
  private escapeRegex(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  /**
   * Create a new lead with normalized fields
   */
  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const normalizedData = {
      ...createLeadDto,
      name: createLeadDto.name.trim(),
      email: createLeadDto.email.trim().toLowerCase(),
      phone: createLeadDto.phone.trim(),
      status: createLeadDto.status || LeadStatus.NEW,
    };

    const newLead = new this.leadModel(normalizedData);
    const saved = await newLead.save();
    this.logger.log(`Created new lead: "${saved.name}" (${saved.email}) with ID: ${saved._id}`);
    return saved;
  }

  /**
   * Retrieve leads with search, status filtering, pagination, and sorting
   */
  async findAll(query: QueryLeadDto): Promise<PaginatedLeads> {
    const {
      q,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, any> = {};

    // Filter by specific status
    if (status) {
      filter.status = status;
    }

    // Search by query string across name, email, and phone
    if (q && q.trim().length > 0) {
      const sanitized = this.escapeRegex(q.trim());
      const regex = new RegExp(sanitized, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.leadModel
        .find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.leadModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find a single lead by ID
   */
  async findOne(id: string): Promise<Lead> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid lead ID format: ${id}`);
    }

    const lead = await this.leadModel.findById(id).exec();
    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    return lead;
  }

  /**
   * Update lead status
   */
  async updateStatus(
    id: string,
    updateLeadStatusDto: UpdateLeadStatusDto,
  ): Promise<Lead> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid lead ID format: ${id}`);
    }

    const updatedLead = await this.leadModel
      .findByIdAndUpdate(
        id,
        { $set: { status: updateLeadStatusDto.status } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedLead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    this.logger.log(`Updated lead ${id} status to: ${updateLeadStatusDto.status}`);
    return updatedLead;
  }

  /**
   * Aggregate statistics for dashboard summary
   */
  async getStats(): Promise<LeadStats> {
    const rawCounts = await this.leadModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const byStatus: Record<LeadStatus, number> = {
      [LeadStatus.NEW]: 0,
      [LeadStatus.CONTACTED]: 0,
      [LeadStatus.QUALIFIED]: 0,
      [LeadStatus.LOST]: 0,
      [LeadStatus.CLOSED]: 0,
    };

    let total = 0;
    for (const item of rawCounts) {
      if (item._id && Object.values(LeadStatus).includes(item._id)) {
        byStatus[item._id as LeadStatus] = item.count;
        total += item.count;
      }
    }

    // Conversion rate: (Qualified + Closed) / Total * 100
    const converted = (byStatus[LeadStatus.QUALIFIED] || 0) + (byStatus[LeadStatus.CLOSED] || 0);
    const conversionRate = total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0;

    return {
      total,
      byStatus,
      conversionRate,
    };
  }
}
