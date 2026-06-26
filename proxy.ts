import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const AUTH_ROUTES = ['/login', '/cadastro', '/recuperar-senha', '/atualizar-senha'];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));
  const isPublicAsset = path.startsWith('/_next') || path.startsWith('/api') || path === '/favicon.ico';

  if (isPublicAsset) {
    return response;
  }

  // Usuário não logado tentando acessar área protegida -> manda para login
  if (!user && !isAuthRoute && path !== '/') {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Usuário já logado tentando acessar páginas de auth -> manda para o dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Raiz: decide para onde mandar dependendo do login
  if (path === '/') {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas, exceto arquivos estáticos do Next e assets.
     */
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
