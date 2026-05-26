import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const cookieNext = cookies().get("clearupsc_auth_next")?.value;
  const decodedCookieNext = cookieNext ? decodeURIComponent(cookieNext) : null;
  const safeNext = next?.startsWith("/") ? next : decodedCookieNext?.startsWith("/") ? decodedCookieNext : null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (safeNext) {
        return redirectAndClearNext(`${origin}${safeNext}`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .maybeSingle();

        return redirectAndClearNext(`${origin}${profile?.onboarding_complete ? "/dashboard" : "/onboarding"}`);
      }

      return redirectAndClearNext(`${origin}/onboarding`);
    }
  }

  return redirectAndClearNext(`${origin}/`);
}

function redirectAndClearNext(url: string) {
  const response = NextResponse.redirect(url);
  response.cookies.set("clearupsc_auth_next", "", { path: "/", maxAge: 0 });
  return response;
}
