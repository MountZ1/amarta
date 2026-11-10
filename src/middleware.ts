import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "amarta-kopi-secret-key-32chars-minimum!!"
);
const COOKIE_NAME = "amarta_admin_token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const protectedAdminPaths = [
    "/auth/dashboard",
    "/auth/products",
    "/auth/users",
    "/auth/orders",
  ];

  const isProtected = protectedAdminPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // If trying to access protected admin page without auth -> redirect to login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and accessing /auth/login -> redirect to dashboard
  if (pathname === "/auth/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*"],
};
