import { NextResponse } from "next/server";

// Only an optimistic redirect. Database sessions and authorization are checked again at every data boundary.
export function proxy(request) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin/signin") || path.startsWith("/portal/signin"))
    return NextResponse.next();
  if (
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("authjs.session-token")
  )
    return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = path.startsWith("/admin") ? "/admin/signin" : "/portal/signin";
  url.search = "";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}
export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/app/:path*"],
};
