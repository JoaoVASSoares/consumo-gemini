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
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true,
    }),
    ConsumptionMeterModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
