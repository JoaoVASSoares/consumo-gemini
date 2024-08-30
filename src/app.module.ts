import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import ConsumptionMeterModule from "./routers/consumptionMeter/consumptionMeter.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "db",
      port: 3306,
      username: "root",
      password: "toor",
      database: "test-shopper",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true,
    }),
    ConsumptionMeterModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
