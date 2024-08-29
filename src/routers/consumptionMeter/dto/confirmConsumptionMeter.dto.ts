import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class ConfirmConsumptionMeterDto {
  @ApiProperty()
  @IsNotEmpty()
  measure_uuid: string;

  @ApiProperty()
  @IsNotEmpty()
  confirmed_value: number;
}
