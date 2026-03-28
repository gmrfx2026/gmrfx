/** Label singkat untuk ENUM_DEAL_TYPE / DEAL_ENTRY (MetaTrader 5). */

export function mt5DealTypeLabel(code: number): string {
  const m: Record<number, string> = {
    0: "Buy",
    1: "Sell",
    2: "Balance",
    3: "Credit",
    4: "Charge",
    5: "Correction",
    6: "Bonus",
    7: "Commission",
    8: "Comm. daily",
    9: "Comm. monthly",
    10: "Comm. agen H",
    11: "Comm. agen B",
    12: "Bunga",
    13: "Buy batal",
    14: "Sell batal",
    15: "Dividen",
    16: "Dividen franked",
    17: "Pajak",
  };
  return m[code] ?? `Tipe ${code}`;
}

export function mt5DealEntryLabel(code: number): string {
  const m: Record<number, string> = {
    0: "Masuk",
    1: "Keluar",
    2: "Reverse",
    3: "Status",
  };
  return m[code] ?? `Entry ${code}`;
}
