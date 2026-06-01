import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { AppRole } from '@/lib/roles';
import { PROTECTED_ROUTES } from '@/lib/roles';

if (!process.env.JWT_SECRET) {
  throw new Error(
    "[Middleware] FATAL: JWT_SECRET environment variable is not set. " +
    "Generate one with: node -e \"require('crypto').randomBytes(64).toString('hex')\" and add it to .env.local"
  );
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const PUBLIC_ROUTES  = ['/login', '/auth/register', '/auth/reset-password', '/api/auth/login', '/api/auth/register', '/api/auth/reset-password'];
const PUBLIC_PREFIXES = ['/_next', '/favicon.ico', '/images', '/photo_'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Bypass static assets ───────────────────────────────────────────────
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r));
  const token = request.cookies.get('auth_token')?.value;

  // ── 2. Unauthenticated → login ────────────────────────────────────────────
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── 3. Verify token ───────────────────────────────────────────────────────
  let role: AppRole | undefined;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      role = payload.role as AppRole;

      // Valid token on login page → redirect to dashboard
      if (pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Invalid/expired token → clear cookie and redirect
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('auth_token');
      return res;
    }
  }

  // ── 4. Role-based route protection ───────────────────────────────────────
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!role || !allowedRoles.includes(role)) {
        // Redirect to dashboard with access-denied signal
        const denied = new URL('/dashboard', request.url);
        denied.searchParams.set('access_denied', route);
        return NextResponse.redirect(denied);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|eot|mp4|pdf)$).*)',
  ],
};
