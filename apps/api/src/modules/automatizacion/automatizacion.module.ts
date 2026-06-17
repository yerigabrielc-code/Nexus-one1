import { Module } from '@nestjs/common';
import { AutomatizacionController } from './api/automatizacion.controller';
import { CreateRuleUseCase } from './application/create-rule.usecase';
import { CreateAlertUseCase } from './application/create-alert.usecase';
import { ListAlertsUseCase } from './application/list-alerts.usecase';
import { CreateApprovalUseCase, DecideApprovalUseCase } from './application/approvals.usecase';

@Module({
  controllers: [AutomatizacionController],
  providers: [
    CreateRuleUseCase,
    CreateAlertUseCase,
    ListAlertsUseCase,
    CreateApprovalUseCase,
    DecideApprovalUseCase,
  ],
  exports: [CreateAlertUseCase],
})
export class AutomatizacionModule {}
