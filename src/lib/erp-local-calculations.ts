/** Pure frontend exercises. No posting, tax policy, stock or real account lookup. */
export function previewDecimal(value: string, scale = 2): bigint | null {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0))
    .replace(/٫/g, ".");
  if (!new RegExp(`^\\d{1,9}(?:\\.\\d{1,${scale}})?$`).test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole!) * 10n ** BigInt(scale) + BigInt(fraction.padEnd(scale, "0"));
}
export function previewAmount(value: bigint, scale = 2): string {
  const sign = value < 0n ? "−" : "";
  const raw = (value < 0n ? -value : value).toString().padStart(scale + 1, "0");
  return `${sign}${raw.slice(0, -scale)}.${raw.slice(-scale)}`;
}
export type PreviewCostLine = {
  description: string;
  quantity: string;
  unit: string;
  price: string;
  discount: string;
  allocation: string;
  expected: string;
};
export function previewLineTotal(line: PreviewCostLine): bigint | null {
  const quantity = previewDecimal(line.quantity, 3);
  const price = previewDecimal(line.price);
  const discount = previewDecimal(line.discount);
  if (
    !line.description.trim() ||
    !line.unit.trim() ||
    quantity === null ||
    quantity <= 0n ||
    price === null ||
    discount === null ||
    discount > 10000n
  )
    return null;
  // Quantity has 3 decimals, price is in hundredths, discount is in basis points.
  // Round each unsigned line half-up to hundredths, never round via binary floats.
  return (quantity * price * (10000n - discount) + 5000000n) / 10000000n;
}
export type PreviewJournalLine = {
  account: string;
  description: string;
  debit: string;
  credit: string;
};
export function previewJournal(lines: PreviewJournalLine[]) {
  let debit = 0n,
    credit = 0n;
  if (lines.length < 2) return null;
  for (const line of lines) {
    const d = line.debit.trim() ? previewDecimal(line.debit) : 0n;
    const c = line.credit.trim() ? previewDecimal(line.credit) : 0n;
    if (
      !line.account.trim() ||
      !line.description.trim() ||
      d === null ||
      c === null ||
      d > 0n === c > 0n
    )
      return null;
    debit += d;
    credit += c;
  }
  return { debit, credit, difference: debit - credit, balanced: debit === credit };
}
