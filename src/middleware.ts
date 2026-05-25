import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/admin",
];

function isProtected(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) return NextResponse.next();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login", "true");
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login", "true");
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/tracker/:path*",
    "/syllabus/:path*",
    "/dashboard/:path*",
    "/planner/:path*",
    "/answer-writing/:path*",
    "/flashcards/:path*",
    "/current-affairs/:path*",
    "/interview/:path*",
    "/profile/:path*",
    "/billing/:path*",
    "/admin/:path*",
    "/prelims/:path*",
    "/onboarding/:path*",
    "/essay/:path*",
    "/csat/:path*",
    "/revision/:path*",
    "/analytics/:path*",
    "/notes/:path*",
  ],
};
