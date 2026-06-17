import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Mapea las excepciones a respuestas HTTP coherentes:
 *  - HttpException (NotFound, Conflict, BadRequest, Unauthorized…) → se respeta.
 *  - DomainError (invariantes de dominio, p. ej. "El RNC debe tener 9 dígitos") → 400.
 *  - Cualquier otra → 500 genérico (y se registra el detalle real en logs).
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return res.status(status).json(
        typeof exception.getResponse() === 'string'
          ? { statusCode: status, message: exception.getResponse() }
          : exception.getResponse(),
      );
    }

    const isDomain =
      exception instanceof Error &&
      (exception.name === 'DomainError' || exception.constructor?.name === 'DomainError');
    if (isDomain) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        error: 'Bad Request',
        message: exception.message,
      });
    }

    this.logger.error(`Unhandled: ${(exception as Error)?.message}`, (exception as Error)?.stack);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
