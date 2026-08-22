import { NextResponse, type NextRequest } from 'next/server';

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value;
  const isLoggedIn = !!sessionToken;

  const publicRoutes = ['/', '/login', '/register', '/pricing', '/about', '/privacy', '/terms'];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    false;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/parcels') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/activity');

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!isLoggedIn && isProtectedRoute && !isPublicRoute) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
