import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Jika berhasil, redirect ke halaman tujuan (biasanya home)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Jika gagal, kembalikan ke login dengan error
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}