"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { TrendingUp, Users, Eye, Calendar, BarChart3, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  viewsToday: number;
  dailyBreakdown: { date: string; views: number; uniqueVisitors: number }[];
  topPages: { _id: string; views: number }[];
}

export default function AnalyticsPanel({ storeId }: { storeId: string | number }) {
  const { t } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/${storeId}?days=${days}`)
      .then(r => { if (!r.ok) throw new Error("API error"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [storeId, days]);

  if (loading) {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("analytics.title")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-[400px]:gap-3 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-50 p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 space-y-3 animate-pulse">
              <div className="w-9 h-9 max-[400px]:w-9 max-[400px]:h-9 w-10 h-10 bg-zinc-200 rounded-xl" />
              <div className="h-3 w-20 bg-zinc-200 rounded" />
              <div className="h-7 max-[400px]:h-7 h-8 w-16 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.dailyBreakdown) {
    return (
      <div className="space-y-8">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter"><TrendingUp className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />{t("analytics.title")}</h3>
        <div className="bg-zinc-50 p-10 max-[400px]:p-8 p-12 rounded-[2.5rem] border border-zinc-100 text-center space-y-3">
          <BarChart3 className="w-10 h-10 max-[400px]:w-10 max-[400px]:h-10 w-12 h-12 text-zinc-200 mx-auto" />
          <p className="text-sm max-[400px]:text-xs font-black italic text-zinc-300 uppercase tracking-wider">{t("analytics.no_data")}</p>
          <p className="text-[10px] font-bold text-zinc-300 italic">{t("analytics.share_hint")}</p>
        </div>
      </div>
    );
  }

  const maxView = Math.max(...(data.dailyBreakdown || []).map(d => d.views), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3 max-[400px]:gap-3 gap-4">
        <h3 className="text-2xl max-[400px]:text-xl font-black italic text-zinc-950 uppercase tracking-tighter">
          <TrendingUp className="w-6 h-6 max-[400px]:w-5 max-[400px]:h-5 inline mr-3 text-red-600" />
          {t("analytics.title")}
        </h3>
        <div className="flex items-center gap-2 bg-zinc-50 rounded-xl p-1 border border-zinc-100">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={cn("px-3 max-[400px]:px-3 px-4 py-2 rounded-lg text-[9px] max-[400px]:text-[9px] text-[10px] font-black italic transition-all uppercase", days === d ? "bg-red-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-950")}>
              {d} {t("analytics.days")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-[400px]:gap-3 gap-5">
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-red-50 rounded-xl w-fit"><Eye className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-red-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">{t("analytics.total_views")}</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{data.totalViews}</p>
        </div>
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-blue-50 rounded-xl w-fit"><Users className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-blue-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">{t("analytics.unique_visitors")}</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{data.uniqueVisitors}</p>
        </div>
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-amber-50 rounded-xl w-fit"><Calendar className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-amber-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">{t("analytics.views_today")}</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{data.viewsToday}</p>
        </div>
        <div className="bg-white p-5 max-[400px]:p-5 p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-2 max-[400px]:space-y-2 space-y-3">
          <div className="p-2.5 max-[400px]:p-2.5 p-3 bg-emerald-50 rounded-xl w-fit"><BarChart3 className="w-4 h-4 max-[400px]:w-4 max-[400px]:h-4 w-5 h-5 text-emerald-600" /></div>
          <p className="text-[8px] max-[400px]:text-[8px] text-[9px] font-black text-zinc-400 uppercase italic">{t("analytics.daily_avg")}</p>
          <p className="text-2xl max-[400px]:text-2xl text-3xl font-black italic text-zinc-950">{data.dailyBreakdown.length ? Math.round(data.totalViews / data.dailyBreakdown.length) : 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 max-[400px]:p-5 p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
        <h4 className="text-sm max-[400px]:text-xs font-black italic text-zinc-950 uppercase tracking-tighter mb-4 max-[400px]:mb-4 mb-6">{t("analytics.views_per_day")}</h4>
        {data.dailyBreakdown.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-black italic text-zinc-300 uppercase tracking-wider">{t("analytics.no_data")}</p>
            <p className="text-[10px] text-zinc-200 font-bold italic mt-1">{t("analytics.share_hint")}</p>
          </div>
        ) : (
          <div className="flex items-end gap-1 max-[400px]:gap-1 gap-2 h-36 max-[400px]:h-36 h-48">
            {data.dailyBreakdown.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 max-[400px]:gap-0.5 gap-1 h-full justify-end">
                <span className="text-[7px] max-[400px]:text-[7px] text-[8px] font-bold text-zinc-400">{d.views}</span>
                <div className="w-full rounded-lg bg-gradient-to-t from-red-600 to-red-400 transition-all hover:from-red-700 hover:to-red-500 min-h-[4px]" style={{ height: `${(d.views / maxView) * 100}%` }} />
                <span className="text-[6px] max-[400px]:text-[6px] text-[7px] font-bold text-zinc-400 uppercase whitespace-nowrap">{new Date(d.date).toLocaleDateString("es", { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 max-[400px]:p-5 p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
        <h4 className="text-sm max-[400px]:text-xs font-black italic text-zinc-950 uppercase tracking-tighter mb-4 max-[400px]:mb-4 mb-6">{t("analytics.top_pages")}</h4>
        {!data.topPages || data.topPages.length === 0 ? (
          <p className="text-xs font-bold italic text-zinc-300">{t("analytics.no_data_simple")}</p>
        ) : (
          <div className="space-y-2">
            {data.topPages.map((page, i) => {
              const label = page._id === "/" ? t("analytics.page_home") : page._id === "/products" ? t("analytics.page_products") : page._id === "/services" ? t("analytics.page_services") : page._id === "/contact" ? t("analytics.page_contact") : page._id;
              const maxPageViews = data.topPages[0].views;
              return (
                <div key={page._id} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all">
                  <span className="w-5 text-center text-[10px] font-black text-zinc-400 italic">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold italic text-zinc-950">{label}</span>
                      <span className="text-[10px] font-black text-zinc-400">{page.views} {t("analytics.views")}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${(page.views / maxPageViews) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
