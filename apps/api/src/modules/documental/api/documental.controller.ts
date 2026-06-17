import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../shared/rbac/permissions.guard';
import { RequirePermissions } from '../../../shared/rbac/permissions.decorator';
import { RegisterDocumentUseCase } from '../application/register-document.usecase';
import { ListDocumentsUseCase } from '../application/list-documents.usecase';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentalController {
  constructor(
    private readonly register: RegisterDocumentUseCase,
    private readonly list: ListDocumentsUseCase,
  ) {}

  @Post()
  @RequirePermissions('document:manage')
  create(@Body() body: any) {
    return this.register.execute(body);
  }

  @Get()
  @RequirePermissions('document:read')
  getAll(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.list.execute({ entityType, entityId });
  }
}
