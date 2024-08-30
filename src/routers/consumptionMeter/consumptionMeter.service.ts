import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConsumptionMeter } from "./entities/consumptionMeter.entity";
import { Between, Repository } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { UploadConsumptionMeterDto } from "./dto/uploadConsumptionMeter.dto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as crypto from "crypto";
import { ConfirmConsumptionMeterDto } from "./dto/confirmConsumptionMeter.dto";
import * as dayjs from "dayjs";
import { ErroCode } from "../core/enum/erroCode.enum";
import { MeasureType } from "../core/enum/measureType.enum";
import { CreateSucesseResponse, ErroResponse, GetSuccessResponse, UpdateSuccessResponse } from "../core/response/response.dto";

@Injectable()
export class ConsumptionMeterService {
  private readonly uploadPath = "./uploads";
  constructor(
    @InjectRepository(ConsumptionMeter)
    private readonly consumptionMeterRepository: Repository<ConsumptionMeter>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  public async upload(dto: UploadConsumptionMeterDto): Promise<CreateSucesseResponse | ErroResponse> {
    const base64Regex = /^data:image\/(png|jpg|jpeg|gif);base64,/;
    if (!base64Regex.test(dto.image)) throw new BadRequestException({ error_code: ErroCode.INVALID_DATA, error_description: "Imagem deve esta em base64" });

    const format = "YYYY-MM-DD HH:mm:ss";
    const date = dayjs(dto.measure_datetime, format, true);
    if (!date.isValid()) throw new BadRequestException({ error_code: ErroCode.INVALID_DATA, error_description: "A data deve esta no formato YYYY-MM-DD HH:mm:ss" });

    if (dto.measure_type !== MeasureType.WATER && dto.measure_type !== MeasureType.GAS) {
      throw new BadRequestException({ error_code: ErroCode.INVALID_DATA, error_description: "Tipo de leitura: WATER ou GAS" });
    }

    const startOfMonth = dayjs(dto.measure_datetime).startOf("month").format("YYYY-MM-DD");
    const endOfMonth = dayjs(dto.measure_datetime).endOf("month").format("YYYY-MM-DD");

    const existingMeasurement = await this.consumptionMeterRepository.find({
      where: {
        customer_code: dto.customer_code,
        measure_datetime: Between(startOfMonth, endOfMonth),
        measure_type: dto.measure_type,
      },
    });

    if (existingMeasurement.length > 0) throw new ConflictException({ error_code: ErroCode.DOUBLE_REPORT, error_description: "Leitura do mês já realizada" });

    const image = await this.saveBase64Image(dto.image);

    const resultGemini = await this.sentImageToGemini(image.filePath, image.format, image.filename);

    const filepath = path.join(this.uploadPath, image.filename);

    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    const consumptionMeter = this.consumptionMeterRepository.create({
      image: dto.image,
      customer_code: dto.customer_code,
      measure_datetime: date.format(format),
      measure_type: dto.measure_type,
      value: isNaN(resultGemini.measure_value) ? 0 : resultGemini.measure_value,
      image_url: resultGemini.image_url,
      measure_uuid: resultGemini.measure_uuid,
    });

    await this.consumptionMeterRepository.save(consumptionMeter);

    return resultGemini;
  }

  public async sentImageToGemini(filePath: string, format: string, filename: string): Promise<CreateSucesseResponse> {
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

    const uploadResult = await fileManager.uploadFile(`./${filePath}`, { mimeType: `image/${format}`, displayName: filename });
    const getResponse = await fileManager.getFile(uploadResult.file.name);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Faça a médição e me retorne apénas o valor da medição.",
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    const objectResponse = {
      image_url: getResponse.uri,
      measure_value: parseFloat(result.response.text().replace(/\n/g, "").trim()),
      measure_uuid: getResponse.sha256Hash,
    };

    return objectResponse;
  }

  public async saveBase64Image(base64Image: string): Promise<{ filename: string; format: string; filePath: string } | any> {
    try {
      const matches = base64Image.match(/^data:image\/(png|jpg|jpeg);base64,(.+)$/);

      if (!matches) {
        throw new BadRequestException("Imagem base64 inválida ou formato não suportado");
      }

      const [, format, base64Data] = matches;
      const buffer = Buffer.from(base64Data, "base64");

      const randomFilename = crypto.randomBytes(16).toString("hex");
      const filename = `${randomFilename}.${format}`;
      const filePath = path.join(this.uploadPath, filename);

      fs.writeFileSync(filePath, buffer);

      return { filename, format, filePath };
    } catch (error) {
      throw new BadRequestException("Erro ao salvar a imagem: " + error.message);
    }
  }

  public async confirm(dto: ConfirmConsumptionMeterDto): Promise<UpdateSuccessResponse | ErroResponse> {
    if (typeof dto.confirmed_value !== "number") throw new BadRequestException({ error_code: ErroCode.INVALID_DATA, error_description: "O valor tem que ser um número" });
    if (typeof dto.measure_uuid !== "string") throw new BadRequestException({ error_code: ErroCode.INVALID_DATA, error_description: "O valor tem que ser um string" });

    const measurement = await this.consumptionMeterRepository.findOne({
      where: {
        measure_uuid: dto.measure_uuid,
      },
    });

    if (!measurement) throw new NotFoundException({ error_code: ErroCode.MEASURE_NOT_FOUND, error_description: "Leitura do mês já realizada" });
    if (measurement.has_confirmed == true) throw new ConflictException({ error_code: ErroCode.CONFIRMATION_DUPLICATE, error_description: "Leitura do mês já realizada" });

    measurement.value = dto.confirmed_value;
    measurement.has_confirmed = true;

    await this.consumptionMeterRepository.save(measurement);

    return { success: true };
  }

  public async list(customer_code: string, query: any): Promise<GetSuccessResponse | ErroResponse> {
    let measures = null;

    if (query.measure_type) {
      if (query.measure_type !== "WATER" && query.measure_type !== "GAS") {
        throw new BadRequestException({ error_code: ErroCode.INVALID_TYPE, error_description: "Tipo de medição não permitida" });
      }

      measures = await this.consumptionMeterRepository.find({
        where: {
          customer_code: customer_code,
          measure_type: query.measure_type,
        },
        select: {
          measure_uuid: true,
          measure_datetime: true,
          measure_type: true,
          has_confirmed: true,
          image_url: true,
        },
      });
    } else {
      measures = await this.consumptionMeterRepository.find({
        where: {
          customer_code: customer_code,
        },
        select: {
          measure_uuid: true,
          measure_datetime: true,
          measure_type: true,
          has_confirmed: true,
          image_url: true,
        },
      });
    }
    if (!measures.length) throw new NotFoundException({ error_code: ErroCode.MEASURE_NOT_FOUND, error_description: "Nenhuma leitura encontrada" });

    const objectReturn = {
      customer_code: customer_code,
      measures: measures,
    };

    return objectReturn;
  }
}
