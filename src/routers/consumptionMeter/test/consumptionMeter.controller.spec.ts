import { Test, TestingModule } from "@nestjs/testing";
import { ConsumptionMeterController } from "../consumptionMeter.controller";
import { ConsumptionMeterService } from "../consumptionMeter.service";
import { UploadConsumptionMeterDto } from "../dto/uploadConsumptionMeter.dto";
import { ConfirmConsumptionMeterDto } from "../dto/confirmConsumptionMeter.dto";
import { ListConsumptionMeterDto } from "../dto/listConsumptionMeter.dto";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { CreateSucesseResponse, GetSuccessResponse, UpdateSuccessResponse } from "../../core/response/response.dto";
import { MeasureType } from "../../core/enum/measureType.enum";

describe("ConsumptionMeterController", () => {
  let controller: ConsumptionMeterController;
  let service: ConsumptionMeterService;

  const mockService = {
    upload: jest.fn(),
    confirm: jest.fn(),
    list: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumptionMeterController],
      providers: [
        {
          provide: ConsumptionMeterService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ConsumptionMeterController>(ConsumptionMeterController);
    service = module.get<ConsumptionMeterService>(ConsumptionMeterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("upload", () => {
    it("should call service.upload with correct parameters", async () => {
      const uploadDto: UploadConsumptionMeterDto = {
        image: "data:image/png;base64,validbase64string",
        measure_datetime: "2024-08-29 12:00:00",
        measure_type: MeasureType.WATER,
        customer_code: "123",
      };
      const mockResponse: CreateSucesseResponse = { image_url: "", measure_uuid: "", measure_value: 0 };

      mockService.upload.mockResolvedValue(mockResponse);

      const result = await controller.upload(uploadDto);

      expect(service.upload).toHaveBeenCalledWith(uploadDto);
      expect(result).toEqual(mockResponse);
    });

    it("should handle BadRequestException", async () => {
      const uploadDto: UploadConsumptionMeterDto = {
        image: "invalid-image",
        measure_datetime: "invalid-date",
        measure_type: "INVALID_TYPE" as MeasureType,
        customer_code: "123",
      };

      mockService.upload.mockRejectedValue(new BadRequestException());

      await expect(controller.upload(uploadDto)).rejects.toThrow(BadRequestException);
    });

    it("should handle ConflictException", async () => {
      const uploadDto: UploadConsumptionMeterDto = {
        image: "data:image/png;base64,validbase64string",
        measure_datetime: "2024-08-29 12:00:00",
        measure_type: MeasureType.WATER,
        customer_code: "123",
      };

      mockService.upload.mockRejectedValue(new ConflictException());

      await expect(controller.upload(uploadDto)).rejects.toThrow(ConflictException);
    });
  });

  describe("confirm", () => {
    it("should call service.confirm with correct parameters", async () => {
      const confirmDto: ConfirmConsumptionMeterDto = {
        measure_uuid: "abc-123",
        confirmed_value: 100,
      };
      const mockResponse: UpdateSuccessResponse = { success: true };

      mockService.confirm.mockResolvedValue(mockResponse);

      const result = await controller.confirm(confirmDto);

      expect(service.confirm).toHaveBeenCalledWith(confirmDto);
      expect(result).toEqual(mockResponse);
    });

    it("should handle BadRequestException", async () => {
      const confirmDto: ConfirmConsumptionMeterDto = {
        measure_uuid: "invalid-uuid",
        confirmed_value: NaN,
      };

      mockService.confirm.mockRejectedValue(new BadRequestException());

      await expect(controller.confirm(confirmDto)).rejects.toThrow(BadRequestException);
    });

    it("should handle NotFoundException", async () => {
      const confirmDto: ConfirmConsumptionMeterDto = {
        measure_uuid: "nonexistent-uuid",
        confirmed_value: 100,
      };

      mockService.confirm.mockRejectedValue(new NotFoundException());

      await expect(controller.confirm(confirmDto)).rejects.toThrow(NotFoundException);
    });

    it("should handle ConflictException", async () => {
      const confirmDto: ConfirmConsumptionMeterDto = {
        measure_uuid: "abc-123",
        confirmed_value: 100,
      };

      mockService.confirm.mockRejectedValue(new ConflictException());

      await expect(controller.confirm(confirmDto)).rejects.toThrow(ConflictException);
    });
  });

  describe("list", () => {
    it("should call service.list with correct parameters", async () => {
      const customerCode = "123";
      const listDto: ListConsumptionMeterDto = {
        measure_type: "WATER",
      };
      const mockResponse: GetSuccessResponse = { customer_code: "", measures: [] };

      mockService.list.mockResolvedValue(mockResponse);

      const result = await controller.list(customerCode, listDto);

      expect(service.list).toHaveBeenCalledWith(customerCode, listDto);
      expect(result).toEqual(mockResponse);
    });

    it("should handle BadRequestException", async () => {
      const customerCode = "123";
      const listDto: ListConsumptionMeterDto = {
        measure_type: "INVALID_TYPE",
      };

      mockService.list.mockRejectedValue(new BadRequestException());

      await expect(controller.list(customerCode, listDto)).rejects.toThrow(BadRequestException);
    });

    it("should handle NotFoundException", async () => {
      const customerCode = "123";
      const listDto: ListConsumptionMeterDto = {
        measure_type: "WATER",
      };

      mockService.list.mockRejectedValue(new NotFoundException());

      await expect(controller.list(customerCode, listDto)).rejects.toThrow(NotFoundException);
    });
  });
});
