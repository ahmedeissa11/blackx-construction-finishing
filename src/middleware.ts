import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isReviewProtectedPath, OWNER_REVIEW_ROLE } from "@/lib/review-auth-shared";

const LOCALES = ["ar", "en"];
const { auth } = NextAuth(authConfig);

export const middleware = auth((request) => {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const locale = LOCALES.find(
    (candidate) => pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`),
  );

  if (!locale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/ar" : `/ar${pathname}`;
    return NextResponse.redirect(url);
  }

  if (isReviewProtectedPath(pathname)) {
    const role = request.auth?.user?.role;
    if (role !== OWNER_REVIEW_ROLE) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.search = "";
      url.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|brand|images|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
