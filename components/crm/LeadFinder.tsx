"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Phone, Globe, Loader2, X, Check, ChevronDown, Settings } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface LeadResult {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  ratingCount: number;
  types: string[];
  website: string;
  coordinates: { lat: number; lng: number };
  selected: boolean;
}

interface Props {
  storeId: string;
  open: boolean;
  onClose: () => void;
  onImport: (leads: any[]) => Promise<void>;
}

const CATEGORIES = [
  { keyword: "restaurant", icon: "🍽️" },
  { keyword: "store", icon: "🛍️" },
  { keyword: "doctor", icon: "🏥" },
  { keyword: "school", icon: "📚" },
  { keyword: "beauty_salon", icon: "💇" },
  { keyword: "gym", icon: "💪" },
  { keyword: "lawyer", icon: "⚖️" },
  { keyword: "auto_repair", icon: "🔧" },
  { keyword: "real_estate_agency", icon: "🏠" },
  { keyword: "accounting", icon: "📊" },
];

export default function LeadFinder({ storeId, open, onClose, onImport }: Props) {
  const { t } = useLanguage();
  const [searchError, setSearchError] = useState("");
  const [searchCenter, setSearchCenter] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].keyword);
  const [customSearch, setCustomSearch] = useState("");
  const [radius, setRadius] = useState(1000);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<LeadResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchSource, setSearchSource] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const catLabelKey = (keyword: string) => `leads.cat_${keyword}`;

  const doSearch = async () => {
    if (!searchCenter.trim()) return;
    setSearching(true);
    setSearched(true);
    setSearchError("");
    setResults([]);

    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: searchCenter.trim(),
          category,
          radius,
          maxResults: 20,
          customKeyword: customSearch.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || t("leads.error_search"));
        return;
      }

      const sourceLabels: Record<string, string> = {
        google: t("leads.source_google"),
        mapbox: t("leads.source_mapbox"),
        osm: t("leads.source_osm"),
      };
      setSearchSource(sourceLabels[data.source] || "");

      const mapped: LeadResult[] = (data.leads || []).map((l: any, i: number) => ({
        placeId: `lead-${i}`,
        name: l.name,
        address: l.address,
        phone: l.phone,
        rating: l.rating,
        ratingCount: l.ratingCount,
        types: l.types,
        website: l.website,
        coordinates: l.coordinates,
        selected: true,
      }));

      setResults(mapped);
    } catch (err: any) {
      console.error("Lead search error:", err);
      setSearchError(err.message || t("leads.error_connection"));
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (placeId: string) => {
    setResults(prev => prev.map(r => r.placeId === placeId ? { ...r, selected: !r.selected } : r));
  };

  const selectAll = () => {
    setResults(prev => prev.map(r => ({ ...r, selected: true })));
  };

  const deselectAll = () => {
    setResults(prev => prev.map(r => ({ ...r, selected: false })));
  };

  const handleImport = async () => {
    const selected = results.filter(r => r.selected);
    if (!selected.length) return;
    setImporting(true);
    try {
      await onImport(selected.map(r => ({
        name: r.name,
        address: r.address,
        phone: r.phone,
        coordinates: r.coordinates,
        notes: `${r.types.join(", ")}${r.website ? ` | ${r.website}` : ""}`,
        source: "import",
        status: "lead",
      })));
      onClose();
    } finally {
      setImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-100 shrink-0">
              <h4 className="text-sm md:text-base font-black italic uppercase tracking-tighter flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" /> {t("leads.title")}
              </h4>
              <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-50 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
              {searchError && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                  <Settings className="w-4 h-4 shrink-0 text-amber-500" />
                  <span className="text-amber-700 font-medium flex-1">{searchError}</span>
                </div>
              )}
              {/* Search form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("leads.location_label")}</label>
                  <input type="text" value={searchCenter} onChange={e => setSearchCenter(e.target.value)}
                    placeholder={t("leads.location_placeholder")}
                    className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("leads.custom_search_label")}</label>
                  <input type="text" value={customSearch} onChange={e => setCustomSearch(e.target.value)}
                    placeholder={t("leads.custom_search_placeholder")}
                    className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium focus:bg-white focus:border-red-200 transition-all" />
                </div>
                <div className="relative">
                  <label className="text-[9px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("leads.category_label")}</label>
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 outline-none text-sm font-medium flex items-center justify-between gap-2"
                  >
                    <span>{CATEGORIES.find(c => c.keyword === category)?.icon} {t(catLabelKey(category))}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-zinc-100 shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                      {CATEGORIES.map(c => (
                        <button key={c.keyword} onClick={() => { setCategory(c.keyword); setShowCategoryDropdown(false); }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2">
                          <span>{c.icon}</span> {t(catLabelKey(c.keyword))}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[9px] font-black italic text-zinc-500 uppercase tracking-wider mb-1.5 block">{t("leads.radius_label").replace("{radius}", String(radius))}</label>
                  <input type="range" min="200" max="5000" step="100" value={radius}
                    onChange={e => setRadius(parseInt(e.target.value))}
                    className="w-full accent-red-600 mt-2" />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.95 }} onClick={doSearch} disabled={!searchCenter.trim() || searching}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-xs font-black italic hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {searching ? t("leads.searching_btn") : t("leads.search_btn")}
              </motion.button>

              {/* Results */}
              {searched && !searching && (
                <>
                  {results.length === 0 && !searchError ? (
                    <div className="py-8 text-center italic font-black uppercase tracking-widest text-zinc-200">
                      {t("leads.no_results")}
                    </div>
                  ) : results.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-zinc-500">{t("leads.results_count").replace("{count}", String(results.length))}</p>
                          {searchSource && (
                            <span onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-integrations"))}
                              className="text-[9px] font-black italic text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-zinc-200 hover:text-zinc-600 transition-all">
                              {t("leads.via").replace("{source}", searchSource)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={selectAll} className="text-[10px] font-bold text-blue-600 hover:text-blue-700">{t("leads.select_all")}</button>
                          <button onClick={deselectAll} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600">{t("leads.deselect_all")}</button>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {results.map(r => (
                          <div key={r.placeId}
                            onClick={() => toggleSelect(r.placeId)}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              r.selected ? "bg-red-50 border-red-200" : "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
                            }`}
                          >
                            <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                              r.selected ? "bg-red-600 border-red-600" : "border-zinc-300"
                            }`}>
                              {r.selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-zinc-900">{r.name}</p>
                              <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{r.address}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {r.rating > 0 && (
                                  <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-current" /> {r.rating.toFixed(1)} ({r.ratingCount})
                                  </span>
                                )}
                                {r.phone && <span className="text-[10px] text-zinc-400 flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{r.phone}</span>}
                                {r.website && <span className="text-[10px] text-blue-500 truncate max-w-[120px]"><Globe className="w-2.5 h-2.5 inline" /> {r.website.replace(/https?:\/\//, "")}</span>}
                                <a href={`https://www.google.com/maps/search/?api=1&query=${r.coordinates.lat},${r.coordinates.lng}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                  className="text-[10px] text-green-600 hover:text-green-700 flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" /> {t("leads.maps_link")}
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleImport} disabled={importing || !results.some(r => r.selected)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black italic hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 mt-3">
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {importing ? t("leads.importing_btn") : t("leads.import_btn").replace("{count}", String(results.filter(r => r.selected).length))}
                      </motion.button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
