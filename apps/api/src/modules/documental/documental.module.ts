import { Module } from '@nestjs/common';
import { DocumentalController } from './api/documental.controller';
import { RegisterDocumentUseCase } from './application/register-document.usecase';
import { ListDocumentsUseCase } from './application/list-documents.usecase';

@Module({
  controllers: [DocumentalController],
  providers: [RegisterDocumentUseCase, ListDocumentsUseCase],
})
export class DocumentalModule {}
