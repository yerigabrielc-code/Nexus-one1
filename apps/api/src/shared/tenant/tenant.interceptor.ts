import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from './tenant-context';

/**
 * Resuelve el tenant EXCLUSIVAMENTE de los claims del JWT verificado (req.user).
 * Nunca del body ni de un header manipulable. Si no hay usuario autenticado,
 * la request sigue sin store (rutas públicas como /auth/login).
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user?.tenantId) {
      return next.handle();
    }
    return new Observable((subscriber) => {
      tenantStorage.run(
        { tenantId: user.tenantId, userId: user.sub, permissions: user.permissions ?? [] },
        () => {
          next.handle().subscribe({
            next: (v) => subscriber.next(v),
            error: (e) => subscriber.error(e),
            complete: () => subscriber.complete(),
          });
        },
      );
    });
  }
}
