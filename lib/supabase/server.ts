import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
 * Gerencia os cookies de sessão via a API `cookies()` do Next.js.
 *
 * A partir do Next.js 16, `cookies()` é assíncrono — por isso esta função
 * também é assíncrona. Em todos os locais que a chamam, usar `await createClient()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Chamado de um Server Component sem permissão de escrita de cookie.
            // Pode ser ignorado com segurança se houver um middleware atualizando a sessão.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Mesmo caso do set() acima.
          }
        },
      },
    }
  );
}
