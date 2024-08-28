import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("API de Gerenciamento de Consumo")
    .setDescription("API para gerenciar a leitura individualizada de consumo de água e gás")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.use(bodyParser.json({ limit: "50mb" })); // Configura o limite para JSON
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true })); // Configura o limite para URL-encoded

  await app.listen(3000);
}
bootstrap();
