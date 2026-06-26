// =============================================================================
// Cliente brapi.dev — cotações reais de ações e FIIs da B3
// =============================================================================
//
// IMPORTANTE: este módulo só deve ser importado em código que roda no
// servidor (Route Handlers, Server Components, Server Actions). O token
// (BRAPI_TOKEN, sem o prefixo NEXT_PUBLIC_) nunca deve chegar ao navegador.

export interface BrapiQuoteResult {
  ticker: string;
  preco: number | null;
  erro?: string;
}

/**
 * Busca a cotação atual de um ou mais tickers em uma única requisição à brapi.dev.
 * Tickers inválidos ou não encontrados retornam preco: null para aquele item,
 * sem derrubar a busca dos demais.
 */
export async function fetchBrapiQuotes(tickers: string[]): Promise<BrapiQuoteResult[]> {
  const uniqueTickers = Array.from(new Set(tickers.map((t) => t.toUpperCase().trim()))).filter(Boolean);
  if (uniqueTickers.length === 0) return [];

  const token = process.env.BRAPI_TOKEN;
  const symbolsParam = uniqueTickers.join(',');
  const url = `https://brapi.dev/api/v2/stocks/quote?symbols=${encodeURIComponent(symbolsParam)}`;

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      // Evita cache do Next.js — queremos o preço mais atual disponível a cada chamada.
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`brapi respondeu ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const results: any[] = json?.results || [];

    const foundMap = new Map<string, number>();
    results.forEach((r) => {
      const symbol = (r.requestedSymbol || r.symbol || '').toUpperCase();
      const price = r?.data?.regularMarketPrice;
      if (symbol && typeof price === 'number') {
        foundMap.set(symbol, price);
      }
    });

    return uniqueTickers.map((ticker) => ({
      ticker,
      preco: foundMap.get(ticker) ?? null,
      erro: foundMap.has(ticker) ? undefined : 'Ticker não encontrado na resposta da brapi',
    }));
  } catch (e: any) {
    console.error('Erro ao buscar cotações na brapi.dev:', e?.message || e);
    // Falha geral (rede, rate limit, token inválido): todos os tickers voltam sem preço,
    // e quem chamou decide o fallback (ex: manter o último preço salvo no banco).
    return uniqueTickers.map((ticker) => ({ ticker, preco: null, erro: 'Falha ao consultar a brapi.dev' }));
  }
}
