import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsumptionMeterController } from "./consumptionMeter.controller";
import { ConsumptionMeterService } from "./consumptionMeter.service";
import { ConsumptionMeter } from "./entities/consumptionMeter.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ConsumptionMeter])],
  controllers: [ConsumptionMeterController],
  providers: [ConsumptionMeterService],
})
export default class ConsumptionMeterModule {}
