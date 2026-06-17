import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { SagaDispatcher } from './saga.dispatcher';
import { currentTenantId } from '../tenant/tenant-context';

/**
 * En SAGA_MODE=sync, tras completar el handler (y dentro del contexto del tenant),
 * drena el Outbox del tenant actual en la misma petición. Reemplaza al relay/worker
 * en entornos serverless (Vercel) sobre Postgres sin BYPASSRLS (Supabase).
 */
@Injectable()
export class SagaDrainInterceptor implements NestInterceptor {
  constructor(private readonly dispatcher: SagaDispatcher) {}

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (process.env.SAGA_MODE !== 'sync') return next.handle();
    return next.handle().pipe(
      concatMap((data) =>
        from(
          (currentTenantId() ? this.dispatcher.drainCurrentTenant() : Promise.resolve()).then(() => data),
        ),
      ),
    );
  }
}
