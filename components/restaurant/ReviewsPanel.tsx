"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Star, Loader2, Send, MessageSquare, Filter,
} from "lucide-react";

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
}

interface Props {
  storeId: string;
}

export default function ReviewsPanel({ storeId }: Props) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/restaurant/${storeId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      showToast(t("restaurant.error_loading"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [storeId]);

  const filtered = ratingFilter === "all" ? reviews : reviews.filter(r => r.rating === parseInt(ratingFilter));
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const submitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await fetch(`/api/restaurant/${storeId}/reviews/${reviewId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, reply: replyText } : r));
      setReplyingTo(null);
      setReplyText("");
      showToast(t("restaurant.reply_sent"), "success");
    } catch {
      showToast(t("restaurant.error_saving"), "error");
    }
  };

  const renderStars = (count: number, size = "w-3.5 h-3.5") => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn(size, i < count ? "fill-amber-400 text-amber-400" : "text-zinc-200")} />
      ))}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-zinc-300 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <h3 className="max-[400px]:text-xl text-2xl font-black italic text-zinc-950 uppercase tracking-tighter">{t("restaurant.reviews")}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 flex flex-col items-center justify-center space-y-2">
          <p className="text-5xl font-black italic text-zinc-950">{avgRating.toFixed(1)}</p>
          {renderStars(Math.round(avgRating), "w-5 h-5")}
          <p className="text-[9px] font-black text-zinc-400 uppercase italic">{reviews.length} {t("restaurant.reviews")}</p>
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 md:p-6 space-y-2.5 md:col-span-2">
          {distribution.map(d => (
            <div key={d.star} className="flex items-center gap-3">
              <span className="text-[10px] font-black text-zinc-400 italic w-3 text-right">{d.star}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 bg-zinc-100 rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="text-[9px] font-bold text-zinc-400 italic w-8 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-zinc-400" />
        <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
          className="bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100 outline-none text-xs font-medium">
          <option value="all">{t("restaurant.all_ratings")}</option>
          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} {t("restaurant.star")}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center italic font-black uppercase tracking-widest text-zinc-200">{t("restaurant.no_reviews")}</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(review => (
            <motion.div key={review._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black italic text-zinc-950">{review.customerName}</p>
                  {renderStars(review.rating)}
                </div>
                <span className="text-[9px] text-zinc-300 font-bold italic shrink-0">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-zinc-600 font-medium italic leading-relaxed">{review.comment}</p>

              {review.reply && (
                <div className="bg-zinc-50 rounded-xl p-3 ml-4 border-l-2 border-red-300">
                  <p className="text-[9px] font-black text-red-600 italic mb-1">{t("restaurant.your_reply")}</p>
                  <p className="text-[10px] text-zinc-600 font-medium italic">{review.reply}</p>
                </div>
              )}

              {!review.reply && (
                <div className="flex items-center gap-2">
                  {replyingTo === review._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                        placeholder={t("restaurant.write_reply")}
                        onKeyDown={e => e.key === "Enter" && submitReply(review._id)}
                        className="flex-1 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100 outline-none text-xs font-medium focus:bg-white focus:border-red-200 transition-all" />
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => submitReply(review._id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                        <Send className="w-3 h-3" />
                      </motion.button>
                      <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                        className="text-zinc-300 hover:text-zinc-500"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => { setReplyingTo(review._id); setReplyText(""); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-zinc-50 text-zinc-500 rounded-lg text-[9px] font-black italic hover:bg-zinc-100 transition-all">
                      <MessageSquare className="w-3 h-3" /> {t("restaurant.reply")}
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
