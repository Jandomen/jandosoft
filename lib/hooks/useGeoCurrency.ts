"use client";

import { useState, useEffect } from "react";
import { CURRENCIES, getCurrency } from "@/components/business/currency";

const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  "America/Mexico_City": "MXN", "America/Mexico_BajaNorte": "MXN", "America/Mexico_BajaSur": "MXN",
  "America/Bogota": "COP", "America/Barranquilla": "COP", "America/Medellin": "COP",
  "America/Argentina/Buenos_Aires": "ARS", "America/Argentina/Cordoba": "ARS",
  "America/Sao_Paulo": "BRL", "America/Manaus": "BRL",
  "America/Santiago": "CLP", "America/Lima": "PEN", "America/Costa_Rica": "CRC",
  "America/New_York": "USD", "America/Chicago": "USD", "America/Los_Angeles": "USD",
  "America/Denver": "USD", "America/Phoenix": "USD", "America/Anchorage": "USD",
  "America/Toronto": "CAD", "America/Vancouver": "CAD",
  "Europe/London": "GBP", "Europe/Paris": "EUR", "Europe/Berlin": "EUR",
  "Europe/Madrid": "EUR", "Europe/Rome": "EUR", "Europe/Amsterdam": "EUR",
  "Europe/Brussels": "EUR", "Europe/Vienna": "EUR", "Europe/Zurich": "CHF",
  "Europe/Stockholm": "SEK", "Europe/Oslo": "NOK", "Europe/Copenhagen": "DKK",
  "Europe/Helsinki": "EUR", "Europe/Warsaw": "PLN", "Europe/Prague": "CZK",
  "Europe/Bucharest": "RON", "Europe/Budapest": "HUF", "Europe/Athens": "EUR",
  "Europe/Lisbon": "EUR", "Europe/Dublin": "EUR",
  "Asia/Tokyo": "JPY", "Asia/Shanghai": "CNY", "Asia/Seoul": "KRW",
  "Asia/Kolkata": "INR", "Asia/Calcutta": "INR", "Asia/Mumbai": "INR",
  "Asia/Dubai": "AED", "Asia/Riyadh": "SAR", "Asia/Istanbul": "TRY",
  "Asia/Bangkok": "THB", "Asia/Ho_Chi_Minh": "VND", "Asia/Jakarta": "IDR",
  "Asia/Manila": "PHP", "Asia/Karachi": "PKR", "Asia/Dhaka": "BDT",
  "Asia/Colombo": "LK", "Asia/Kathmandu": "NP",
  "Australia/Sydney": "AUD", "Australia/Melbourne": "AUD",
  "Pacific/Auckland": "NZD",
  "Africa/Johannesburg": "ZAR", "Africa/Lagos": "NGN", "Africa/Nairobi": "KEN",
  "America/Caracas": "VES", "America/Montevideo": "UYU", "America/Asuncion": "PYG",
  "America/La_Paz": "BOB", "America/Santo_Domingo": "DOP",
  "America/Guatemala": "GTQ", "America/Tegucigalpa": "HNL",
  "America/Managua": "NIO", "America/Panama": "PAB",
  "Atlantic/Reykjavik": "ISK",
};

const LANG_TO_CURRENCY: Record<string, string> = {
  es: "USD", en: "USD", pt: "BRL", fr: "EUR", de: "EUR", it: "EUR",
  ja: "JPY", zh: "CNY", ko: "KRW", hi: "INR", ar: "USD", ru: "USD",
  nl: "EUR", pl: "PLN", th: "THB", vi: "VND", tr: "TRY", sv: "SEK",
  da: "DKK", no: "NOK", fi: "EUR", cs: "CZK", ro: "RON", hu: "HUF",
  bg: "BGN", hr: "EUR", sk: "EUR", sl: "EUR", lt: "EUR", lv: "EUR",
  et: "EUR", el: "EUR", uk: "USD", he: "USD", id: "IDR", ms: "MYR",
  tl: "PHP", bn: "BDT", ta: "INR", te: "INR", mr: "INR", gu: "INR",
  kn: "INR", ml: "INR", pa: "INR", ur: "PKR", fa: "USD", sw: "KES",
  am: "USD", ne: "NPR", si: "LKR", my: "MMK", km: "KHR", lo: "LAK",
  ka: "USD", hy: "USD", az: "USD", kk: "KZT", uz: "UZS", mn: "MNT",
};

function detectFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_CURRENCY[tz]) return TIMEZONE_TO_CURRENCY[tz];
    const continent = tz?.split("/")[0];
    if (continent === "America") {
      const city = tz?.split("/")[1] || "";
      if (city.includes("Mexico")) return "MXN";
      if (city.includes("Bogota") || city.includes("Barranquilla") || city.includes("Medellin")) return "COP";
      if (city.includes("Buenos") || city.includes("Cordoba") || city.includes("Rosario")) return "ARS";
      if (city.includes("Sao_Paulo") || city.includes("Manaus")) return "BRL";
      if (city.includes("Santiago")) return "CLP";
      if (city.includes("Lima")) return "PEN";
    }
  } catch {}
  return "";
}

function detectCurrencyFromBrowser(): string {
  const tzCurrency = detectFromTimezone();
  if (tzCurrency) return tzCurrency;

  try {
    const lang = navigator.language || (navigator as any).languages?.[0] || "";
    const countryMatch = lang.match(/[-_]([A-Z]{2})$/i);
    if (countryMatch) {
      const code = countryMatch[1].toUpperCase();
      const map: Record<string, string> = {
        MX: "MXN", CO: "COP", AR: "ARS", BR: "BRL", CL: "CLP", PE: "PEN",
        CR: "CRC", US: "USD", CA: "CAD", GB: "GBP", ES: "EUR", DE: "EUR",
        FR: "EUR", IT: "EUR", JP: "JPY", CN: "CNY", IN: "INR", AU: "AUD",
        CH: "CHF", VE: "VES", UY: "UYU", PY: "PYG", DO: "DOP",
      };
      if (map[code]) return map[code];
    }

    const langs = navigator.languages || [];
    for (const l of langs) {
      const m = l.match(/[-_]([A-Z]{2})$/i);
      if (m) {
        const code = m[1].toUpperCase();
        const map: Record<string, string> = {
          MX: "MXN", CO: "COP", AR: "ARS", BR: "BRL", US: "USD", CA: "CAD",
        };
        if (map[code]) return map[code];
      }
    }

    const baseLang = lang.split(/[-_]/)[0].toLowerCase();
    if (LANG_TO_CURRENCY[baseLang]) return LANG_TO_CURRENCY[baseLang];
  } catch {}
  return "USD";
}

const CURRENCY_OPTIONS = [
  { code: "USD", label: "USD ($)", flag: "🇺🇸" },
  { code: "MXN", label: "MXN (MX$)", flag: "🇲🇽" },
  { code: "COP", label: "COP (COL$)", flag: "🇨🇴" },
  { code: "ARS", label: "ARS (AR$)", flag: "🇦🇷" },
  { code: "BRL", label: "BRL (R$)", flag: "🇧🇷" },
  { code: "CLP", label: "CLP (CLP$)", flag: "🇨🇱" },
  { code: "PEN", label: "PEN (S/)", flag: "🇵🇪" },
  { code: "EUR", label: "EUR (€)", flag: "🇪🇺" },
  { code: "GBP", label: "GBP (£)", flag: "🇬🇧" },
  { code: "CAD", label: "CAD (C$)", flag: "🇨🇦" },
];

export function useGeoCurrency() {
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("jandosoft_currency");
    if (saved && CURRENCIES.find(c => c.code === saved)) {
      setCurrencyCode(saved);
      setLoading(false);
      return;
    }

    const detected = detectCurrencyFromBrowser();
    setCurrencyCode(detected);
    localStorage.setItem("jandosoft_currency", detected);
    setLoading(false);
  }, []);

  const setCurrency = (code: string) => {
    setCurrencyCode(code);
    localStorage.setItem("jandosoft_currency", code);
  };

  const currency = getCurrency(currencyCode);

  const convertPrice = (usdPrice: number): number => {
    if (currencyCode === "USD") return usdPrice;
    return Math.round(usdPrice * currency.rate * 100) / 100;
  };

  const formatPrice = (usdPrice: number): string => {
    const converted = convertPrice(usdPrice);
    if (["JPY", "KRW", "PYG", "COP", "CLP", "IDR", "VND", "IRR", "MMK", "LAK", "MNT", "UZS", "KZT", "BDT", "KHR", "NGN", "EGP", "PKR", "NPR", "LKR"].includes(currencyCode)) {
      return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  return { currencyCode, currency, setCurrency, convertPrice, formatPrice, loading, CURRENCY_OPTIONS };
}
