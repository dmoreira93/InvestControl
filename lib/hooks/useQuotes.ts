'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Busca o preço do Bitcoin em BRL via CoinGecko (API pública, sem chave).
 * Retorna null silenciosamente em caso de falha — quem chama decide o fallback.
 */
export async function fetchBitcoinPrice(): Promise<number | null> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl');
    if (!res.ok) throw new Error('Falha na resposta da CoinGecko');
    const data = await res.json();
    const price = data?.bitcoin?.brl;
    return typeof price === 'number' ? price : null;
  } catch (e) {
    console.warn('CoinGecko indisponível, mantendo último preço salvo.', e);
    return null;
  }
}

/** Hook que mantém o preço do BTC atualizado, com refresh automático a cada 60s. */
export function useBitcoinPrice(initialPrice: number | null = null) {
  const [price, setPrice] = useState<number | null>(initialPrice);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const newPrice = await fetchBitcoinPrice();
    if (newPrice !== null) setPrice(newPrice);
    setLoading(false);
    return newPrice;
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { price, loading, refresh };
}

/**
 * Hook que simula uma caminhada aleatória sutil (~±0.15% por tick) nos preços
 * de ações/FIIs, ancorada no preço médio pago, para dar sensação de mercado vivo.
 * Tickers com preço já salvo no banco (quotesByTicker) mantêm esse valor como base.
 */
export function useLiveStockQuotes(
  tickers: string[],
  basePrices: Record<string, number>
) {
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      const initial: Record<string, number> = {};
      tickers.forEach((t) => {
        initial[t] = basePrices[t] ?? 10;
      });
      setQuotes(initial);
      initializedRef.current = true;
    }
  }, [tickers, basePrices]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuotes((prev) => {
        const next: Record<string, number> = { ...prev };
        Object.keys(next).forEach((ticker) => {
          const variation = Math.random() * 0.003 - 0.0015; // ±0.15%
          next[ticker] = Math.max(0.01, next[ticker] * (1 + variation));
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const setManualPrice = useCallback((ticker: string, price: number) => {
    setQuotes((prev) => ({ ...prev, [ticker]: price }));
  }, []);

  return { quotes, setManualPrice };
}
