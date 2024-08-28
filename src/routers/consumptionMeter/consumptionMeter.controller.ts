import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConsumptionMeterService } from "./consumptionMeter.service";
import { UploadConsumptionMeterDto } from "./dto/uploadConsumptionMeter.dto";

@ApiTags("ConsumptionMeter")
@Controller("api/v1/consumptionMeter")
export class ConsumptionMeterController {
  constructor(private readonly consumptionMeterService: ConsumptionMeterService) {}

  @Post()
  public async upload(@Body() uploadConsumptionMeter: UploadConsumptionMeterDto) {
    return this.consumptionMeterService.upload(uploadConsumptionMeter);
  }
}
