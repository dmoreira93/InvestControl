# Vértice — Controle de Investimentos

Aplicação completa de controle de investimentos e finanças pessoais, construída com **Next.js 16 (App Router)**, **Supabase** (autenticação + banco de dados com Row Level Security) e **Tailwind CSS**.

## Estrutura do projeto

```
app/
  (auth)/              → páginas públicas de autenticação (sem sidebar)
    login/
    cadastro/
    recuperar-senha/
    atualizar-senha/
  (app)/                → páginas protegidas (com sidebar), uma pasta por "página"
    dashboard/
    cadastro-transacao/
    bolsa/
    renda-fixa/
    tesouro/
    fundos/
    cripto/
    financas/           → Controle Financeiro (orçamento, dívidas, proventos, metas)
  auth/callback/        → Route Handler que troca o code do Supabase por sessão
components/             → componentes React organizados por área
lib/
  finance/              → lógica financeira pura (sem dependência de UI), testável isoladamente
  hooks/                → hooks que conectam a lógica financeira ao Supabase
  supabase/              → clientes Supabase (browser, server, middleware)
supabase/
  schema.sql            → schema completo do banco (tabelas + RLS), execute uma vez no seu projeto
proxy.ts                → middleware de autenticação (Next.js 16 renomeou middleware.ts → proxy.ts)
```

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor** do seu projeto, cole e execute todo o conteúdo de `supabase/schema.sql`. Isso cria todas as tabelas (`transactions`, `quotes`, `user_config`, `finance_entries`, `debts`, `financial_goals`, `budget_limits`) já com Row Level Security configurada — cada usuário só acessa os próprios dados.
3. Em **Authentication → URL Configuration**, configure:
   - **Site URL**: a URL do seu deploy (ex: `https://seu-app.vercel.app`)
   - **Redirect URLs**: adicione `https://seu-app.vercel.app/auth/callback` (e `http://localhost:3000/auth/callback` para desenvolvimento local)
4. Em **Authentication → Providers → Email**, confirme que "Confirm email" está habilitado se quiser exigir confirmação por e-mail no cadastro (recomendado).
5. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

## 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
BRAPI_TOKEN=seu-token-da-brapi-aqui
```

O `BRAPI_TOKEN` é gratuito: crie uma conta em [brapi.dev/dashboard](https://brapi.dev/dashboard) e gere um token na seção "Chaves de API". Ele é usado para buscar cotações reais de ações e FIIs da B3 (ver seção "Cotações reais de Bolsa" abaixo). Diferente das variáveis do Supabase, este token **não leva o prefixo `NEXT_PUBLIC_`** — ele só é lido em código de servidor (Route Handler) e nunca chega ao navegador.

**Importante:** se em algum momento esse token aparecer exposto em algum lugar público (chat, repositório, print), revogue-o no dashboard da brapi.dev e gere um novo.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.

## 4. Subir para o GitHub

```bash
git init
git add .
git commit -m "Initial commit: Vértice"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

O `.gitignore` já está configurado para não subir `node_modules`, `.next`, `.env.local` e outros arquivos sensíveis/gerados.

## 5. Deploy no Vercel

1. Importe o repositório do GitHub em [vercel.com/new](https://vercel.com/new).
2. Nas configurações do projeto, adicione as mesmas variáveis de ambiente do passo 2 (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Deploy. O Vercel detecta o Next.js automaticamente — não é necessário configurar build command ou output directory.
4. Depois do primeiro deploy, volte ao Supabase e atualize a **Site URL** e **Redirect URLs** (passo 1.3) com a URL final gerada pelo Vercel.

## Funcionalidades

### Investimentos
- **Dashboard**: patrimônio total, lucro/prejuízo, renda passiva estimada, gráficos de alocação e crescimento.
- **Cadastro de Transação**: formulário dinâmico que muda os campos conforme a categoria.
- **Bolsa de Valores**: P/VP para FIIs (com tag de desconto), detecção de Penny Stock, ordenação por maior desconto, e o "Número Mágico" do efeito infinito.
- **Renda Fixa**: cálculo exato com convenção de 252 dias úteis, IOF regressivo e IR regressivo (CDB/LCI/LCA).
- **Tesouro Direto**: alerta de marcação a mercado.
- **Fundos de Investimento**: controle por cotas.
- **Criptomoedas**: preço do Bitcoin em tempo real via CoinGecko.

### Controle Financeiro (`/financas`)
- **Resumo do mês**: receitas, despesas, proventos e saldo, com gráfico de despesas por categoria.
- **Lançamentos**: registro de receitas, despesas e proventos (com vínculo opcional a um ticker, ex: dividendo de um FII).
- **Orçamento**: defina limites mensais por categoria de despesa e acompanhe o progresso.
- **Dívidas**: cartões, empréstimos e financiamentos, com registro de pagamentos e progresso de quitação.
- **Metas**: reservas e objetivos financeiros com aportes e barra de progresso.

## Notas técnicas

- Autenticação via Supabase Auth (e-mail/senha), com confirmação por e-mail e recuperação de senha.
- Todas as tabelas usam Row Level Security: um usuário nunca acessa dados de outro, mesmo via API direta.
- A taxa Selic Meta é configurável manualmente (painel de calibração na sidebar) para os cálculos de CDI funcionarem mesmo sem uma API de taxas em tempo real.

### Cotações reais de Bolsa (brapi.dev)

O preço de ações e FIIs é buscado da [brapi.dev](https://brapi.dev), uma API de dados da B3 com plano gratuito. O fluxo funciona assim:

1. Ao abrir a página **Bolsa**, o app chama `POST /api/quotes/refresh` (Route Handler, roda no servidor).
2. Esse endpoint busca todos os tickers da sua carteira **em uma única requisição** à brapi.dev e grava o preço retornado na tabela `quotes` do Supabase.
3. Se a brapi não responder (rate limit, ticker não encontrado, fora do ar), o app mantém o último preço salvo no banco e mostra um aviso discreto na tela — nunca quebra a página.
4. Não há polling automático: a busca acontece uma vez por carregamento da página, o que é mais que suficiente para quem abre o app algumas vezes por dia e está bem dentro do limite do plano gratuito.

Você também pode sempre sobrescrever manualmente o preço de um ticker na tabela (botão de atualizar ao lado de cada linha), o que é útil para ativos que a brapi não cubra ou em caso de indisponibilidade temporária da API.
