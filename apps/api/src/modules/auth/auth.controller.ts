import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { LoginSchema, type LoginDto } from '@nexus/contracts';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ZodValidationPipe } from '../../shared/validation/zod.pipe';

const isProd = process.env.NODE_ENV === 'production';
// Cross-site (web y api en dominios distintos, p. ej. *.vercel.app): requiere
// SameSite=None + Secure para que el navegador envíe la cookie en peticiones XHR.
const crossSite = process.env.COOKIE_CROSS_SITE === 'true';
const ACCESS_COOKIE = 'nexus_access';
const REFRESH_COOKIE = 'nexus_refresh';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const common = {
    httpOnly: true,
    sameSite: (crossSite ? 'none' : 'lax') as 'none' | 'lax',
    secure: isProd || crossSite, // SameSite=None obliga a Secure
    path: '/',
  };
  res.cookie(ACCESS_COOKIE, accessToken, { ...common, maxAge: Number(process.env.JWT_ACCESS_TTL ?? 900) * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...common, maxAge: Number(process.env.JWT_REFRESH_TTL ?? 2_592_000) * 1000 });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const r = await this.auth.login(dto);
    // Tokens en cookies httpOnly (mitiga XSS); el body solo lleva el usuario.
    setAuthCookies(res, r.accessToken, r.refreshToken);
    return { user: r.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return { id: req.user.sub, tenantId: req.user.tenantId, permissions: req.user.permissions };
  }
}
