export function resolveTradingPrice(marketData = {}) {
  const mark =
    marketData.mark_price ??
    marketData.markPrice ??
    null;

  const last =
    marketData.last_price ??
    marketData.lastPrice ??
    marketData.close ??
    null;

  const index =
    marketData.index_price ??
    marketData.indexPrice ??
    null;

  const resolvedPrice = mark ?? last ?? index ?? null;
  const source = mark != null ? "MARK" : last != null ? "LAST" : index != null ? "INDEX" : "NONE";

  return {
    price: resolvedPrice,
    source
  };
}
