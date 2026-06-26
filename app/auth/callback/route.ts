import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Callback usado pelo Supabase após confirmação de e-mail (signUp) ou
 * link de recuperação de senha (resetPasswordForEmail). Troca o `code`
 * recebido na URL por uma sessão válida e redireciona o usuário.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Código inválido ou ausente — manda para o login com um aviso
  return NextResponse.redirect(`${origin}/login?error=callback_failed`);
}
