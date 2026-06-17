import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginDto } from '@nexus/contracts';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { withTenant } from '../../shared/prisma/tenant-runner';
import { verifyPassword } from '../../shared/security/password';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant || !tenant.isActive) throw new UnauthorizedException('Credenciales inválidas');

    // Cargamos al usuario y sus permisos dentro del contexto del tenant (RLS).
    const result = await withTenant(
      this.prisma,
      async (tx) => {
        const user = await tx.user.findFirst({
          where: { tenantId: tenant.id, email: dto.email, deletedAt: null, isActive: true },
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
          },
        });
        return user;
      },
      tenant.id,
    );

    if (!result || !(await verifyPassword(result.passwordHash, dto.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const permissions = [
      ...new Set(
        result.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key)),
      ),
    ];

    const claims = { sub: result.id, tenantId: tenant.id, permissions };
    const accessToken = await this.jwt.signAsync(claims);
    const refreshToken = await this.jwt.signAsync(
      { sub: result.id, tenantId: tenant.id, type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
        expiresIn: `${process.env.JWT_REFRESH_TTL ?? 2592000}s`,
      },
    );

    return {
      accessToken,
      refreshToken,
      user: { id: result.id, fullName: result.fullName, email: result.email, permissions },
    };
  }
}
