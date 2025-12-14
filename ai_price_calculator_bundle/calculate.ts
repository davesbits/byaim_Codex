export function calculateAnnualCost({
  inputTokensPerMonth,
  outputTokensPerMonth,
  price,
}: {
  inputTokensPerMonth: number;
  outputTokensPerMonth: number;
  price: { input_per_mtok: number; output_per_mtok: number };
}) {
  const inputCost = (inputTokensPerMonth / 1_000_000) * price.input_per_mtok;
  const outputCost = (outputTokensPerMonth / 1_000_000) * price.output_per_mtok;
  const monthly = inputCost + outputCost;
  return { monthly, yearly: monthly * 12 };
}