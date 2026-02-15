import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = cookies();

  // Verify caller is admin
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', user.email)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service role for admin operations
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    companyName,
    contactName,
    email: clientEmail,
    password,
    industry,
    websiteUrl,
    monthlyInvestment,
    partnershipStart,
  } = await request.json();

  if (!companyName || !contactName || !clientEmail || !password) {
    return NextResponse.json({ error: 'Company name, contact name, email, and password are required' }, { status: 400 });
  }

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: clientEmail,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Create company record
  const startDate = partnershipStart || new Date().toISOString().split('T')[0];
  const ownershipDate = new Date(startDate);
  ownershipDate.setMonth(ownershipDate.getMonth() + 6);

  const { data: companyData, error: companyError } = await adminClient
    .from('companies')
    .insert({
      company_name: companyName,
      industry: industry || null,
      website_url: websiteUrl || null,
      monthly_investment: monthlyInvestment || null,
      partnership_start: startDate,
      ownership_date: ownershipDate.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single();

  if (companyError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: companyError.message }, { status: 400 });
  }

  // Create user record linked to company
  const { error: userError } = await adminClient
    .from('users')
    .insert({
      id: authData.user.id,
      company_id: companyData.id,
      full_name: contactName,
      email: clientEmail,
      role: 'owner',
      is_admin: false,
    });

  if (userError) {
    await adminClient.from('companies').delete().eq('id', companyData.id);
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, companyId: companyData.id });
}
