import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export enum MeasureType {
  WATER = "WATER",
  GAS = "GAS",
}

export class UploadConsumptionMeterDto {
  @ApiProperty({ description: "Imagem deve estar em base64" })
  @IsString()
  image: string;

  @ApiProperty({ description: "Código do cliente" })
  @IsString()
  @IsNotEmpty()
  customer_code: string;

  @ApiProperty({ description: "Data da medida no formato YYYY-MM-DD HH:mm:ss", example: "2024-08-28 15:30:00", type: String })
  @IsNotEmpty()
  measure_datetime: string;

  @ApiProperty({ description: "Tipo de leitura: WATER ou GAS", enum: MeasureType })
  @IsString()
  @IsNotEmpty()
  measure_type: MeasureType;
}
