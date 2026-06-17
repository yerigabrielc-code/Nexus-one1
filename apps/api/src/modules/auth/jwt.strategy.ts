import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

export interface JwtClaims {
  sub: string;
  tenantId: string;
  permissions: string[];
}

// Extrae el access token de la cookie httpOnly o, en su defecto, del header Bearer.
const fromCookie = (req: Request): string | null => req?.cookies?.['nexus_access'] ?? null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    });
  }

  // El retorno se inyecta en req.user (lo consume TenantInterceptor y PermissionsGuard).
  async validate(payload: JwtClaims) {
    return { sub: payload.sub, tenantId: payload.tenantId, permissions: payload.permissions };
  }
}
