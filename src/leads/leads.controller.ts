import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto.js';
import { QueryLeadDto } from './dto/query-lead.dto.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * Create a new lead
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  /**
   * Retrieve aggregate statistics for leads
   */
  @Get('stats')
  getStats() {
    return this.leadsService.getStats();
  }

  /**
   * Retrieve all leads with optional search, status filtering, and pagination
   */
  @Get()
  findAll(@Query() query: QueryLeadDto) {
    return this.leadsService.findAll(query);
  }

  /**
   * Retrieve single lead by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  /**
   * Update lead status
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateLeadStatusDto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(id, updateLeadStatusDto);
  }
}
