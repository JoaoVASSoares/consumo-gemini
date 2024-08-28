import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsIn, IsNotEmpty, IsString } from "class-validator";

export enum MeasureType {
  WATER = "WATER",
  GAS = "GAS",
}

export class UploadConsumptionMeterDto {
  @ApiProperty({ description: "Imagem em base64" })
  @IsString()
  image: string;

  @ApiProperty({ description: "Código do cliente" })
  @IsString()
  customerCode: string;

  @ApiProperty({ description: "Data da medida no formato YYYY-MM-DD HH:mm:ss", format: "date-time", type: String })
  @IsDateString()
  @IsNotEmpty()
  measure_datetime: string;

  @ApiProperty({ description: "Tipo de leitura: WATER ou GAS", enum: MeasureType })
  @IsString()
  @IsIn([MeasureType.WATER, MeasureType.GAS], { message: "type must be either WATER or GAS" })
  type: MeasureType;
}
