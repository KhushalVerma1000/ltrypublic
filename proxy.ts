import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that REQUIRE authentication — redirect to /login if tokens are invalid
const PROTECTED_PATHS = ['/dashboard'];

// Pages that are part of the booking flow but still accessible to guests
// (guests see a "Log in to Book" button instead of booking form)
const SEMI_PROTECTED_PATHS = ['/pools'];

export const config = {
  matcher: [
    // Run on all paths except static assets so we can refresh tokens on any page
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));

  // Helper: decode JWT expiry (no crypto needed — just base64 decode the payload)
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Add 30-second buffer so we refresh slightly before actual expiry
      return payload.exp * 1000 - 30_000 < Date.now();
    } catch {
      return true;
    }
  };

  // ── 1. Valid (non-expired) access token ──────────────────────────────────
  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  // ── 2. Access token missing/expired — try refresh if we have refreshToken ─
  if (refreshToken) {
    try {
      const API_URL = process.env.API_URL ?? 'http://localhost:8000/api/v1';

      const refreshRes = await fetch(`${API_URL}/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Backend reads refreshToken from req.cookies OR req.body
          Cookie: `refreshToken=${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newAccessToken: string | undefined = data?.data?.accessToken;
        const newRefreshToken: string | undefined = data?.data?.refreshToken;

        if (newAccessToken && newRefreshToken) {
          // Forward the new tokens to downstream Server Components via cookie header
          const requestHeaders = new Headers(request.headers);
          const existingCookies = request.cookies
            .getAll()
            .filter(c => c.name !== 'accessToken' && c.name !== 'refreshToken')
            .map(c => `${c.name}=${c.value}`);

          existingCookies.push(`accessToken=${newAccessToken}`);
          existingCookies.push(`refreshToken=${newRefreshToken}`);
          requestHeaders.set('cookie', existingCookies.join('; '));

          const nextResp = NextResponse.next({
            request: { headers: requestHeaders },
          });

          const cookieBase = {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
          };

          // Match backend token lifetimes: ACCESS_TOKEN_EXPIRY = '1d', REFRESH_TOKEN_EXPIRY = '7d'
          nextResp.cookies.set('accessToken', newAccessToken, {
            ...cookieBase,
            maxAge: 60 * 60 * 24,       // 1 day
          });
          nextResp.cookies.set('refreshToken', newRefreshToken, {
            ...cookieBase,
            maxAge: 60 * 60 * 24 * 7,   // 7 days
          });

          return nextResp;
        }
      }

      // ── Refresh failed: token expired or used ─────────────────────────────
      // The error "Refresh token is expired or used" (admin.controller.ts:212 / 
      // user.controller.ts refreshAccessToken) is thrown here.
      // Clear the stale refreshToken so we don't retry on every request,
      // then redirect to login only if on a protected route.
      if (isProtected) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const redirect = NextResponse.redirect(loginUrl);
        redirect.cookies.delete('accessToken');
        redirect.cookies.delete('refreshToken');
        return redirect;
      }

      // For public pages: clear stale cookie but allow through
      const passthrough = NextResponse.next();
      passthrough.cookies.delete('accessToken');
      passthrough.cookies.delete('refreshToken');
      return passthrough;

    } catch (err) {
      console.error('[proxy] Token refresh network error:', err);
      // Network error — don't block the user, let the page handle auth state
      return NextResponse.next();
    }
  }

  // ── 3. No tokens at all ───────────────────────────────────────────────────
  if (isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
