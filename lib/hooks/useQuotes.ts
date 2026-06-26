'use client';

import { useCallback, useEffect, useState } from 'react';

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
 * Hook que busca cotações reais de ações/FIIs (via Route Handler que consulta
 * a brapi.dev) uma vez ao montar, e expõe um `refresh` manual e o estado de
 * `lastUpdated`/`loading`/`failed` para a UI informar o usuário.
 *
 * Não faz polling automático: o caso de uso é "abrir o app e ver o preço
 * certo", não tempo real — então uma busca por carregamento de página é
 * suficiente e evita gastar a cota gratuita da API sem necessidade.
 */
export function useRealStockQuotes() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failedTickers, setFailedTickers] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotes/refresh', { method: 'POST' });
      const json = await res.json();
      setFailedTickers(json.failed || []);
      setLastUpdated(new Date());
      return json;
    } catch (e) {
      console.warn('Falha ao atualizar cotações reais.', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, lastUpdated, failedTickers, refresh };
}
