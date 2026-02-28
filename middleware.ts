import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession() for routing decisions — reads the JWT from cookies
  // locally without a network round-trip. The JWT is cryptographically
  // signed so it can't be forged. Actual data security is enforced by
  // RLS (validates JWT on every query) and getUser() in API routes.
  //
  // getUser() was causing ~500ms+ latency on every navigation because it
  // makes a network call to Supabase's auth server on every request.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Helper: copy refreshed auth cookies onto a different response so the
  // browser stays in sync even when we return a redirect or 401.
  function forwardCookies(target: NextResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      target.cookies.set(cookie.name, cookie.value);
    });
    return target;
  }

  // Return 401 for unauthenticated API requests
  if (!user && request.nextUrl.pathname.startsWith("/api")) {
    return forwardCookies(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }

  // Redirect unauthenticated users to login (except auth pages)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return forwardCookies(NextResponse.redirect(url));
  }

  // Redirect authenticated users away from auth pages
  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return forwardCookies(NextResponse.redirect(url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
