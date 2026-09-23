import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { Lead, LeadStatus } from './schemas/lead.schema.js';

describe('LeadsService', () => {
  let service: LeadsService;
  let mockLeadModel: any;

  const sampleLead = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1234567890',
    status: LeadStatus.NEW,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Mock constructor function and static methods
    function MockLeadModel(this: any, dto: any) {
      Object.assign(this, dto);
      this._id = '507f1f77bcf86cd799439011';
      this.save = vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...dto,
      });
    }

    mockLeadModel = MockLeadModel as any;

    mockLeadModel.find = vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([sampleLead]),
          }),
        }),
      }),
    });

    mockLeadModel.countDocuments = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(1),
    });

    mockLeadModel.findById = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(sampleLead),
    });

    mockLeadModel.findByIdAndUpdate = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        ...sampleLead,
        status: LeadStatus.QUALIFIED,
      }),
    });

    mockLeadModel.aggregate = vi.fn().mockResolvedValue([
      { _id: LeadStatus.NEW, count: 5 },
      { _id: LeadStatus.QUALIFIED, count: 2 },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: getModelToken(Lead.name),
          useValue: mockLeadModel,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should normalize and create a new lead', async () => {
      const dto = {
        name: '  Jane Doe  ',
        email: '  JANE@EXAMPLE.COM ',
        phone: ' +1234567890 ',
        status: LeadStatus.NEW,
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
      expect(result.phone).toBe('+1234567890');
    });
  });

  describe('findAll', () => {
    it('should return paginated leads with metadata', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should apply search filter regex', async () => {
      await service.findAll({ q: 'Jane', page: 1, limit: 10 });
      expect(mockLeadModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single lead by valid ID', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(sampleLead);
    });

    it('should throw BadRequestException for invalid ObjectId', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when lead is not found', async () => {
      mockLeadModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('507f1f77bcf86cd799439012')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update the status of a lead', async () => {
      const result = await service.updateStatus('507f1f77bcf86cd799439011', {
        status: LeadStatus.QUALIFIED,
      });

      expect(result.status).toBe(LeadStatus.QUALIFIED);
    });

    it('should throw BadRequestException for invalid ObjectId', async () => {
      await expect(
        service.updateStatus('bad-id', { status: LeadStatus.QUALIFIED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      mockLeadModel.findByIdAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateStatus('507f1f77bcf86cd799439011', {
          status: LeadStatus.LOST,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should calculate statistics and conversion rate', async () => {
      const stats = await service.getStats();
      expect(stats.total).toBe(7);
      expect(stats.byStatus[LeadStatus.NEW]).toBe(5);
      expect(stats.byStatus[LeadStatus.QUALIFIED]).toBe(2);
      expect(stats.conversionRate).toBeGreaterThan(0);
    });
  });
});
