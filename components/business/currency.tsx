import React from "react";
import {
  Store, Package, Users, ShoppingCart, Clock, TrendingUp, FileText,
  Megaphone, Plug, Zap, Bot, BookOpen, Settings, Code, FileSpreadsheet,
  Building2, Layers, User, CheckCircle2, AlertTriangle, Edit3, Sparkles, ImageIcon,
  BarChart3, ConciergeBell, UtensilsCrossed, BookHeart, GraduationCap,
  Presentation, UserRound, Award, Briefcase, FolderKanban, Gavel,
  ClipboardPlus, Pill, Stethoscope, Warehouse, Star, Scissors, Scale, ShoppingBag,
  LayoutGrid, ClipboardList, Tag, Bell, MessageSquare
} from "lucide-react";

export const CURRENCIES: { code: string; symbol: string; name: string; rate: number }[] = [
  { code: "USD", symbol: "$", name: "Dólar estadounidense", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "Libra esterlina", rate: 0.79 },
  { code: "MXN", symbol: "MX$", name: "Peso mexicano", rate: 18.5 },
  { code: "COP", symbol: "COL$", name: "Peso colombiano", rate: 4100 },
  { code: "ARS", symbol: "AR$", name: "Peso argentino", rate: 1050 },
  { code: "BRL", symbol: "R$", name: "Real brasileño", rate: 5.15 },
  { code: "CLP", symbol: "CLP$", name: "Peso chileno", rate: 940 },
  { code: "PEN", symbol: "S/", name: "Sol peruano", rate: 3.75 },
  { code: "CRC", symbol: "₡", name: "Colón costarricense", rate: 520 },
  { code: "CAD", symbol: "C$", name: "Dólar canadiense", rate: 1.36 },
  { code: "JPY", symbol: "¥", name: "Yen japonés", rate: 151 },
  { code: "CNY", symbol: "¥", name: "Yuan chino", rate: 7.24 },
  { code: "INR", symbol: "₹", name: "Rupia india", rate: 83.5 },
  { code: "AUD", symbol: "A$", name: "Dólar australiano", rate: 1.54 },
  { code: "CHF", symbol: "CHF", name: "Franco suizo", rate: 0.88 },
  { code: "VES", symbol: "Bs.", name: "Bolívar venezolano", rate: 36.5 },
  { code: "UYU", symbol: "$U", name: "Peso uruguayo", rate: 39.5 },
  { code: "PYG", symbol: "₲", name: "Guaraní paraguayo", rate: 7500 },
  { code: "BOB", symbol: "Bs", name: "Boliviano", rate: 6.96 },
  { code: "DOP", symbol: "RD$", name: "Peso dominicano", rate: 59 },
  { code: "GTQ", symbol: "Q", name: "Quetzal guatemalteco", rate: 7.78 },
  { code: "HNL", symbol: "L", name: "Lempira hondureño", rate: 24.8 },
  { code: "NIO", symbol: "C$", name: "Córdoba nicaragüense", rate: 36.7 },
  { code: "PAB", symbol: "B/.", name: "Balboa panameño", rate: 1 },
];

export function getCurrency(code: string) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

export function convertToUSD(amount: number, fromCurrency: string): number {
  const currency = getCurrency(fromCurrency);
  if (currency.code === "USD") return amount;
  return Math.round((amount / currency.rate) * 100) / 100;
}

export function formatPrice(price: number, currencyCode: string): string {
  const c = getCurrency(currencyCode);
  return `${c.symbol}${price.toFixed(2)}`;
}

export const MODULE_ICONS: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 />, Package: <Package />, ConciergeBell: <Store />,
  CalendarCheck: <Clock />, Users: <Users />, ShoppingCart: <ShoppingCart />,
  TrendingUp: <TrendingUp />, FileText: <FileText />, Megaphone: <Megaphone />,
  Plug: <Plug />, Zap: <Zap />, Bot: <Bot />, BookOpen: <BookOpen />,
  Settings: <Settings />, Code: <Code />, FileSpreadsheet: <FileSpreadsheet />,
  Users2: <Users />, Building2: <Building2 />, UtensilsCrossed: <Store />,
  BookHeart: <BookOpen />, GraduationCap: <TrendingUp />,
  Presentation: <Layers />, UserRound: <User />, Award: <CheckCircle2 />,
  Briefcase: <Store />, FolderKanban: <Layers />, Gavel: <AlertTriangle />,
  ClipboardPlus: <FileText />, Pill: <Package />, Stethoscope: <Store />,
  Warehouse: <Layers />, Image: <ImageIcon />, Star: <Sparkles />,
  Scissors: <Edit3 />, Scale: <AlertTriangle />, ShoppingBag: <ShoppingCart />,
  LayoutGrid: <LayoutGrid />, ClipboardList: <ClipboardList />, Tag: <Tag />,
  Bell: <Bell />, MessageSquare: <MessageSquare />,
};
