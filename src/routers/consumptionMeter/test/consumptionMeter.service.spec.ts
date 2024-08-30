import { Test, TestingModule } from "@nestjs/testing";
import { ConsumptionMeterService } from "../consumptionMeter.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConsumptionMeter } from "../entities/consumptionMeter.entity";
import { Repository } from "typeorm";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { MeasureType } from "../../core/enum/measureType.enum";
// TODO: Melhorar isso
const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe("ConsumptionMeterService", () => {
  let service: ConsumptionMeterService;
  let repository: Repository<ConsumptionMeter>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsumptionMeterService, { provide: getRepositoryToken(ConsumptionMeter), useValue: mockRepository() }],
    }).compile();

    service = module.get<ConsumptionMeterService>(ConsumptionMeterService);
    repository = module.get<Repository<ConsumptionMeter>>(getRepositoryToken(ConsumptionMeter));
  });

  describe("upload", () => {
    it("should throw BadRequestException if image is not in base64 format", async () => {
      const dto = { image: "invalid_image", measure_datetime: "2024-08-30 00:00:00", measure_type: MeasureType.WATER, customer_code: "123" };

      await expect(service.upload(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if date format is invalid", async () => {
      const dto = { image: "data:image/png;base64,valid", measure_datetime: "invalid_date", measure_type: MeasureType.WATER, customer_code: "123" };

      await expect(service.upload(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if measure_type is invalid", async () => {
      const dto = { image: "data:image/png;base64,valid", measure_datetime: "2024-08-30 00:00:00", measure_type: "INVALID_TYPE" as MeasureType, customer_code: "123" };

      await expect(service.upload(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException if measurement already exists for the month", async () => {
      jest.spyOn(repository, "find").mockResolvedValue([{ customer_code: "123", measure_type: MeasureType.WATER, measure_datetime: "2024-08-30" }] as any);
      const dto = { image: "data:image/png;base64,valid", measure_datetime: "2024-08-30 00:00:00", measure_type: MeasureType.WATER, customer_code: "123" };

      await expect(service.upload(dto)).rejects.toThrow(ConflictException);
    });

    it("should call saveBase64Image if image is valid", async () => {
      jest.spyOn(service, "saveBase64Image").mockResolvedValue({ filename: "test.png", format: "png", filePath: "./uploads/test.png" });
      const dto = { image: "data:image/png;base64,valid", measure_datetime: "2024-08-30 00:00:00", measure_type: MeasureType.WATER, customer_code: "123" };

      await service.upload(dto);

      expect(service.saveBase64Image).toHaveBeenCalled();
    });

    it("should call sentImageToGemini with correct arguments", async () => {
      jest.spyOn(service, "sentImageToGemini").mockResolvedValue({ image_url: "url", measure_value: 100, measure_uuid: "uuid" });
      const dto = { image: "data:image/png;base64,valid", measure_datetime: "2024-08-30 00:00:00", measure_type: MeasureType.WATER, customer_code: "123" };

      await service.upload(dto);

      expect(service.sentImageToGemini).toHaveBeenCalled();
    });

    it("should save the consumption meter in the repository", async () => {
      jest.spyOn(service, "saveBase64Image").mockResolvedValue({ filename: "test.png", format: "png", filePath: "./uploads/test.png" });
      jest.spyOn(service, "sentImageToGemini").mockResolvedValue({ image_url: "url", measure_value: 100, measure_uuid: "uuid" });
      jest.spyOn(repository, "save").mockResolvedValue({} as any);

      const dto = { image: "data:image/png;base64,valid", measure_datetime: "2024-08-30 00:00:00", measure_type: MeasureType.WATER, customer_code: "123" };

      await service.upload(dto);

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe("confirm", () => {
    it("should throw BadRequestException if confirmed_value is not a number", async () => {
      const dto = { confirmed_value: NaN, measure_uuid: "uuid" };

      await expect(service.confirm(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if measure_uuid is not a string", async () => {
      const dto = { confirmed_value: 100, measure_uuid: "" };

      await expect(service.confirm(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if measurement is not found", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValue(null);
      const dto = { confirmed_value: 100, measure_uuid: "uuid" };

      await expect(service.confirm(dto)).rejects.toThrow(NotFoundException);
    });

    it("should throw ConflictException if measurement has already been confirmed", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValue({ has_confirmed: true } as any);
      const dto = { confirmed_value: 100, measure_uuid: "uuid" };

      await expect(service.confirm(dto)).rejects.toThrow(ConflictException);
    });

    it("should update the measurement value and save it", async () => {
      jest.spyOn(repository, "findOne").mockResolvedValue({ has_confirmed: false, value: 0 } as any);
      jest.spyOn(repository, "save").mockResolvedValue({} as any);

      const dto = { confirmed_value: 100, measure_uuid: "uuid" };

      await service.confirm(dto);

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("should throw BadRequestException if measure_type is invalid", async () => {
      const query = { measure_type: "INVALID_TYPE" };

      await expect(service.list("123", query)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if no measurements found", async () => {
      jest.spyOn(repository, "find").mockResolvedValue([]);
      const query = {};

      await expect(service.list("123", query)).rejects.toThrow(NotFoundException);
    });

    it("should return measures for the customer code", async () => {
      jest
        .spyOn(repository, "find")
        .mockResolvedValue([{ measure_uuid: "uuid", measure_datetime: "2024-08-30", measure_type: "WATER", has_confirmed: false, image_url: "url" }] as any);

      const result = await service.list("123", {});

      expect(result).toHaveProperty("customer_code", "123");
      expect(result).toHaveProperty("measures");
    });
  });
});
