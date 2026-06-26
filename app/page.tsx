export default function RootPage() {
  // O middleware.ts redireciona '/' para '/dashboard' (logado) ou '/login'
  // (não logado) antes desta página renderizar. Este conteúdo é apenas
  // um fallback caso o redirecionamento não ocorra por algum motivo.
  return null;
}
