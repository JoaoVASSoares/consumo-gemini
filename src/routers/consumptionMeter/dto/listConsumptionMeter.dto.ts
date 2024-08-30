import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { MeasureType } from "src/routers/core/enum/measureType.enum";

export class ListConsumptionMeterDto {
  @ApiPropertyOptional({ description: "Tipo de leitura: WATER ou GAS", enum: MeasureType, isArray: true })
  @IsOptional()
  measure_type: string;
}
