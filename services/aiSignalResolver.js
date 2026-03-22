export function resolveAISignal(signalData = {}) {
  const score = Number(signalData.score ?? signalData.aiScore ?? 0);

  let label = "중립";
  if (score >= 70) label = "강세";
  else if (score <= 30) label = "약세";

  const confidence =
    signalData.confidence ??
    Score ${score}/100;

  const signalCount =
    signalData.signalCount ??
    signalData.signal_strength ??
    null;

  const updatedAt =
    signalData.updatedAt ??
    signalData.timestamp ??
    null;

  return {
    score,
    label,
    confidence,
    signalCount,
    updatedAt
  };
}
