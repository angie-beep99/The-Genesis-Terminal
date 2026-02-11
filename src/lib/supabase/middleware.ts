import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes
  if (pathname === "/" || pathname === "/login" || pathname === "/admin") {
    // If user is logged in and trying to access login page, redirect
    if (user && pathname === "/login") {
      // Check if admin
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        return NextResponse.redirect(
          new URL("/admin/clients", request.nextUrl)
        );
      }
      return NextResponse.redirect(new URL("/terminal", request.nextUrl));
    }

    if (user && pathname === "/admin") {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        return NextResponse.redirect(
          new URL("/admin/clients", request.nextUrl)
        );
      }
    }

    return supabaseResponse;
  }

  // Protected routes
  if (!user) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin", request.nextUrl));
    }
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Check role-based access
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  if (pathname.startsWith("/admin/clients") && profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/terminal", request.nextUrl));
  }

  if (pathname.startsWith("/terminal") && profile?.role === "admin") {
    return NextResponse.redirect(
      new URL("/admin/clients", request.nextUrl)
    );
  }

  return supabaseResponse;
}
