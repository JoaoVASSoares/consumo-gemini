import { ApiProperty } from "@nestjs/swagger";

export class CreateSucesseResponse {
  @ApiProperty()
  image_url: string;
  @ApiProperty()
  measure_value: number;
  @ApiProperty()
  measure_uuid: string;
}

export class UpdateSuccessResponse {
  @ApiProperty()
  success: boolean;
}

class Measures {
  @ApiProperty()
  measure_uuid: string;

  @ApiProperty()
  measure_datetime: Date;

  @ApiProperty()
  measure_type: string;

  @ApiProperty()
  has_confirmed: string;

  @ApiProperty()
  image_url: string;
}

export class GetSuccessResponse {
  @ApiProperty()
  customer_code: string;

  @ApiProperty({ type: [Measures] })
  measures: Measures[];
}

export class ErroResponse {
  @ApiProperty()
  error_code: string;
  @ApiProperty()
  error_description: string;
}
