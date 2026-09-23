import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';
import { LeadStatus } from './schemas/lead.schema.js';

describe('LeadsController', () => {
  let controller: LeadsController;
  let service: LeadsService;

  const sampleLead = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1234567890',
    status: LeadStatus.NEW,
  };

  const mockLeadsService = {
    create: vi.fn().mockResolvedValue(sampleLead),
    findAll: vi.fn().mockResolvedValue({
      data: [sampleLead],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    }),
    findOne: vi.fn().mockResolvedValue(sampleLead),
    updateStatus: vi.fn().mockResolvedValue({
      ...sampleLead,
      status: LeadStatus.CONTACTED,
    }),
    getStats: vi.fn().mockResolvedValue({
      total: 1,
      byStatus: { [LeadStatus.NEW]: 1 },
      conversionRate: 0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        {
          provide: LeadsService,
          useValue: mockLeadsService,
        },
      ],
    }).compile();

    controller = module.get<LeadsController>(LeadsController);
    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a lead', async () => {
    const dto = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1234567890',
    };
    const result = await controller.create(dto);
    expect(result).toEqual(sampleLead);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should get all leads with query', async () => {
    const query = { page: 1, limit: 10 };
    const result = await controller.findAll(query);
    expect(result.data).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should get single lead by id', async () => {
    const result = await controller.findOne('507f1f77bcf86cd799439011');
    expect(result).toEqual(sampleLead);
    expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should update lead status', async () => {
    const result = await controller.updateStatus('507f1f77bcf86cd799439011', {
      status: LeadStatus.CONTACTED,
    });
    expect(result.status).toBe(LeadStatus.CONTACTED);
    expect(service.updateStatus).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { status: LeadStatus.CONTACTED },
    );
  });

  it('should return lead stats', async () => {
    const stats = await controller.getStats();
    expect(stats.total).toBe(1);
    expect(service.getStats).toHaveBeenCalled();
  });
});
