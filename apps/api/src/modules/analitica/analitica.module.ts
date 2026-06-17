import { Module } from '@nestjs/common';
import { AnaliticaController } from './api/analitica.controller';
import { GetExecutiveDashboardUseCase } from './application/get-executive-dashboard.usecase';
import { GetSalesSummaryUseCase } from './application/get-sales-summary.usecase';

@Module({
  controllers: [AnaliticaController],
  providers: [GetExecutiveDashboardUseCase, GetSalesSummaryUseCase],
})
export class AnaliticaModule {}
