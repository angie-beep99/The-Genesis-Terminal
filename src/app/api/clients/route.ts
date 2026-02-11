import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Verify the caller is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { company_name, contact_name, contact_email, password } = body;

  if (!company_name || !contact_name || !contact_email || !password) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // Use service role client to create auth user
  const serviceClient = createServiceRoleClient();

  // Create the auth user
  const { data: authUser, error: authError } =
    await serviceClient.auth.admin.createUser({
      email: contact_email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Create client record
  const { data: client, error: clientError } = await serviceClient
    .from("clients")
    .insert({ company_name, contact_name, contact_email })
    .select()
    .single();

  if (clientError) {
    // Clean up auth user if client creation fails
    await serviceClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: clientError.message }, { status: 500 });
  }

  // Create user profile linking auth user to client
  const { error: profileError } = await serviceClient
    .from("user_profiles")
    .insert({
      id: authUser.user.id,
      role: "client",
      client_id: client.id,
      email: contact_email,
    });

  if (profileError) {
    // Clean up on failure
    await serviceClient.from("clients").delete().eq("id", client.id);
    await serviceClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json(client, { status: 201 });
}
