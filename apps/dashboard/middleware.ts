import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.pathname === "/") {
    url.pathname = "/finance";
    return NextResponse.redirect(url);
  }

  if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
    url.pathname = "/finance";
    return NextResponse.redirect(url);
  }

  if (url.pathname.startsWith("/dashboard/")) {
    const nextPath = url.pathname.replace("/dashboard", "") || "/";
    url.pathname = nextPath === "/" ? "/finance" : nextPath;
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"]
};
