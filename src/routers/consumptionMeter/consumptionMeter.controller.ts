import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ConsumptionMeterService } from "./consumptionMeter.service";
import { UploadConsumptionMeterDto } from "./dto/uploadConsumptionMeter.dto";
import { ErroResponse, CreateSucesseResponse, GetSuccessResponse, UpdateSuccessResponse } from "./response/response.dto";
import { ConfirmConsumptionMeterDto } from "./dto/confirmConsumptionMeter.dto";
import { ListConsumptionMeterDto } from "./dto/listConsumptionMeter.dto";

@ApiTags("Consumption Meter")
@Controller()
export class ConsumptionMeterController {
  constructor(private readonly consumptionMeterService: ConsumptionMeterService) {}

  @Post("/upload")
  @HttpCode(200)
  @ApiOperation({ description: "Responsável por receber uma imagem em base 64, consultar o Gemini e retornar a medida lida pela API" })
  @ApiResponse({
    status: 200,
    description: "Operação realizada com sucesso",
    type: CreateSucesseResponse,
  })
  @ApiConflictResponse({
    status: 409,
    description: "Já existe uma leitura para este tipo no mês atual",
    type: ErroResponse,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: "Os dados fornecidos no corpo da requisição são inválidos",
    type: ErroResponse,
  })
  public async upload(@Body() uploadConsumptionMeter: UploadConsumptionMeterDto) {
    return this.consumptionMeterService.upload(uploadConsumptionMeter);
  }

  @Patch("/confirm")
  @HttpCode(200)
  @ApiOperation({ description: "Responsável por confirmar ou corrigir o valor lido pelo LLM" })
  @ApiResponse({
    status: 200,
    description: "Operação realizada com sucesso",
    type: UpdateSuccessResponse,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: "Os dados fornecidos no corpo da requisição são inválidos",
    type: ErroResponse,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: "Leitura não encontrada",
    type: ErroResponse,
  })
  @ApiConflictResponse({
    status: 409,
    description: "Já existe uma leitura para este tipo no mês atual",
    type: ErroResponse,
  })
  public async confirm(@Body() confirmConsumptionMeter: ConfirmConsumptionMeterDto) {
    return this.consumptionMeterService.confirm(confirmConsumptionMeter);
  }

  @Get(":_customerCode/list")
  @HttpCode(200)
  @ApiOperation({ description: "Responsável por listar as medidas realizadas por um determinado cliente" })
  @ApiResponse({
    status: 200,
    description: "Operação realizada com sucesso",
    type: GetSuccessResponse,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: "Parâmetro measure type diferente de WATER ou GAS",
    type: ErroResponse,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: "Nenhum registro encontrado",
    type: ErroResponse,
  })
  public async list(@Param("_customerCode") _customerCode: string, @Query() filter: ListConsumptionMeterDto) {
    return this.consumptionMeterService.list(_customerCode, filter);
  }
}
