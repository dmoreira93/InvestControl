// =============================================================================
// Cliente bolsai (usebolsai.com) — indicadores fundamentalistas de ações da B3
// =============================================================================
//
// IMPORTANTE: este módulo só deve ser importado em código que roda no
// servidor (Route Handlers, Server Components, Server Actions). A chave
// (BOLSAI_API_KEY, sem o prefixo NEXT_PUBLIC_) nunca deve chegar ao navegador.
//
// A API expõe dois endpoints relevantes aqui:
//   GET /fundamentals/{ticker}  -> P/L, P/VP, ROE, EV/EBITDA, market cap, etc.
//   GET /dividends/{ticker}     -> dividend yield TTM e histórico de pagamentos
// Plano gratuito: 200 requisições/dia, sem cartão de crédito.

const BASE_URL = 'https://api.usebolsai.com/api/v1';

export interface BolsaiFundamentalsResult {
  ticker: string;
  pl: number | null;
  pvp: number | null;
  roe: number | null;
  evEbitda: number | null;
  enterpriseValue: number | null;
  cash: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  erro?: string;
}

async function fetchOne(path: string, apiKey: string): Promise<any | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store',
    });
    if (!res.ok) {
      // 404 = ticker não coberto pela bolsai (comum para FIIs pequenos ou
      // ativos menos líquidos); outros códigos = rate limit, chave inválida, etc.
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`Erro ao consultar bolsai (${path}):`, (e as any)?.message || e);
    return null;
  }
}

/**
 * Busca os indicadores fundamentalistas de um ticker. Faz 2 chamadas
 * (fundamentals + dividends) porque a bolsai separa esses dados em endpoints
 * distintos. Se qualquer uma falhar, os campos correspondentes voltam null
 * em vez de quebrar a busca inteira — quem chama decide o fallback (manter
 * valor manual já salvo, por exemplo).
 */
export async function fetchBolsaiFundamentals(ticker: string): Promise<BolsaiFundamentalsResult> {
  const apiKey = process.env.BOLSAI_API_KEY;
  const cleanTicker = ticker.toUpperCase().trim();

  if (!apiKey) {
    return {
      ticker: cleanTicker, pl: null, pvp: null, roe: null, evEbitda: null,
      enterpriseValue: null, cash: null, marketCap: null, dividendYield: null,
      erro: 'BOLSAI_API_KEY não configurada no servidor',
    };
  }

  const [fundamentals, dividends] = await Promise.all([
    fetchOne(`/fundamentals/${cleanTicker}`, apiKey),
    fetchOne(`/dividends/${cleanTicker}`, apiKey),
  ]);

  if (!fundamentals && !dividends) {
    return {
      ticker: cleanTicker, pl: null, pvp: null, roe: null, evEbitda: null,
      enterpriseValue: null, cash: null, marketCap: null, dividendYield: null,
      erro: 'Ticker não encontrado na bolsai (sem fundamentos nem dividendos)',
    };
  }

  return {
    ticker: cleanTicker,
    pl: fundamentals?.pl ?? null,
    pvp: fundamentals?.pvp ?? null,
    roe: fundamentals?.roe ?? null,
    evEbitda: fundamentals?.ev_ebitda ?? null,
    enterpriseValue: fundamentals?.enterprise_value ?? null,
    cash: fundamentals?.cash ?? null,
    marketCap: fundamentals?.market_cap ?? null,
    dividendYield: dividends?.dividend_yield_ttm ?? null,
    erro: !fundamentals ? 'Fundamentos não encontrados (apenas dividendos disponíveis)' : undefined,
  };
}

/** Busca fundamentos de múltiplos tickers em paralelo (cada um consome 2 requisições). */
export async function fetchBolsaiFundamentalsBatch(tickers: string[]): Promise<BolsaiFundamentalsResult[]> {
  const uniqueTickers = Array.from(new Set(tickers.map((t) => t.toUpperCase().trim()))).filter(Boolean);
  return Promise.all(uniqueTickers.map((t) => fetchBolsaiFundamentals(t)));
}
