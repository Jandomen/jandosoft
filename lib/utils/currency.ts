const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", MXN: "MX$", COP: "COL$", ARS: "AR$", BRL: "R$", JPY: "¥", CNY: "¥", CLP: "CL$", PEN: "S/", UYU: "$U", PYG: "₲", VES: "Bs.", GTQ: "Q", HNL: "L", NIO: "C$", CRC: "₡", PAB: "B/.", DOP: "RD$", CUP: "₱", MAD: "د.م.", DZD: "د.ج", EGP: "ج.م", NGN: "₦", KES: "KSh", GHS: "GH₵", ZAR: "R", TRY: "₺", RUB: "₽", INR: "₹", PKR: "₨", BDT: "৳", IDR: "Rp", MYR: "RM", PHP: "₱", THB: "฿", VND: "₫", KRW: "₩", TWD: "NT$", SGD: "S$", HKD: "HK$", AUD: "A$", NZD: "NZ$", CAD: "C$", CHF: "CHF", SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł", CZK: "Kč", HUF: "Ft", RON: "lei", BGN: "лв", HRK: "kn", RSD: "din", UAH: "₴", GEL: "₾", AZN: "₼", KZT: "₸", UZS: "сўм", MMK: "K", LAK: "₭", KHR: "៛", MNT: "₮", BWP: "P", SZL: "L", LSL: "L", NAD: "N$", MZN: "MT", MWK: "MK", ZMW: "ZK", ETB: "Br", SOS: "Sh", SDG: "SDG", SSP: "SSP", SLL: "Le", LRD: "L$", CVE: "$", MUR: "₨", SCR: "₨", DJF: "Fdj", KMF: "CF", GNF: "FG", XOF: "CFA", XAF: "FCFA", XPF: "₣", BOB: "Bs",
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || "$";
}

export function formatPublicPrice(price: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${price.toFixed(2)}`;
}
