import { Module } from '@nestjs/common';
import { ActivosController } from './api/activos.controller';
import { CreateAssetUseCase } from './application/create-asset.usecase';
import { CreateWorkOrderUseCase } from './application/create-work-order.usecase';
import { CompleteWorkOrderUseCase } from './application/complete-work-order.usecase';
import { ActivosQueries } from './application/activos.queries';

@Module({
  controllers: [ActivosController],
  providers: [CreateAssetUseCase, CreateWorkOrderUseCase, CompleteWorkOrderUseCase, ActivosQueries],
})
export class ActivosModule {}
