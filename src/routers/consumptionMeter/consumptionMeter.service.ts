import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConsumptionMeter } from "./entities/consumptionMeter.entity";
import { Repository } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { UploadConsumptionMeterDto } from "./dto/uploadConsumptionMeter.dto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

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

  // Melhorar a consulta e tals.
  public async upload(dto: UploadConsumptionMeterDto) {
    // const base64Regex = /^data:image\/(png|jpg|jpeg|gif);base64,/;

    // if (!base64Regex.test(dto.image)) throw new BadRequestException("Imagem deve esta em base64");

    const existingMeasurement = await this.consumptionMeterRepository.findOne({
      where: {
        measure_datetime: dto.measure_datetime,
        type: dto.type,
      },
    });
    console.log(existingMeasurement);
    if (existingMeasurement) throw new BadRequestException("Já existe uma medição para este mês");

    // await this.saveBase64Image(dto.image, "uploaded-image.png");
    // return this.sentToGemini("");

    return this.sentImageToGemini();
  }

  // public async sentToGemini(propt: string) {
  //   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  //   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  //   // const result = await model.generateContent(propt);
  //   // const response = await result.response;
  //   // const text = response.text();

  //   const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

  //   return text;
  // }

  // TODO: Melhorar este código para receber os parametros corretos.
  public async sentImageToGemini() {
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

    const uploadResult = await fileManager.uploadFile(`./uploads/uploaded-image.png.jpeg`, { mimeType: "image/jpeg", displayName: "teste" });
    const getResponse = await fileManager.getFile(uploadResult.file.name);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Tell me about this image, quero um link temporario da imagem também, um guid",
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    return result.response, getResponse;
  }

  // TODO: Corrigir a forma que é salvo estes arquivos.
  public async saveBase64Image(base64Image: string, filename: string): Promise<string> {
    try {
      // Verifica se a base64 está no formato esperado
      const matches = base64Image.match(/^data:image\/(png|jpg|jpeg);base64,(.+)$/);

      if (!matches) {
        throw new BadRequestException("Imagem base64 inválida ou formato não suportado");
      }

      const [, format, base64Data] = matches;
      const buffer = Buffer.from(base64Data, "base64");
      const filePath = path.join(this.uploadPath, `${filename}.${format}`);

      // Salva o buffer como um arquivo de imagem
      fs.writeFileSync(filePath, buffer);

      return filePath;
    } catch (error) {
      throw new BadRequestException("Erro ao salvar a imagem: " + error.message);
    }
  }
}
