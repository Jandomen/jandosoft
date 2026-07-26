"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminSocket } from "@/lib/socket-client";

interface Affiliate {
  _id: string;
  userId: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  status: "pending" | "active" | "suspended";
  stripeAccountStatus?: string;
  totalEarnings: number;
  pendingBalance: number;
  paidBalance: number;
  totalReferrals: number;
  activeReferrals: number;
  commissionRate: number;
  createdAt: string;
}

interface Commission {
  _id: string;
  affiliateId: string;
  amount: number;
  percentage: number;
  plan: string;
  planPrice: number;
  period: string;
  status: "pending" | "approved" | "paid" | "rejected";
  createdAt: string;
}

interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalCommissionsPaid: number;
  pendingPayouts: number;
  totalReferrals: number;
}

export default function AffiliatesAdminSection() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<AffiliateStats>({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalCommissionsPaid: 0,
    pendingPayouts: 0,
    totalReferrals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"overview" | "affiliates" | "commissions">("overview");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAffiliates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      const data = await res.json();
      if (data.success) {
        setAffiliates(data.affiliates || []);
        setStats(data.stats || {
          totalAffiliates: 0,
          activeAffiliates: 0,
          totalCommissionsPaid: 0,
          pendingPayouts: 0,
          totalReferrals: 0,
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCommissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/affiliates/commissions");
      const data = await res.json();
      if (data.success) {
        setCommissions(data.commissions || []);
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
    }
  }, []);

  const fetchAll = useCallback(() => {
    fetchAffiliates();
    fetchCommissions();
  }, [fetchAffiliates, fetchCommissions]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useAdminSocket((event, data) => {
    console.log("[WS] Received:", event, data);
    fetchAll();
  });

  const handleStatusChange = async (affiliateId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, status: newStatus }),
      });

      if (res.ok) {
        await fetchAffiliates();
      }
    } catch (error) {
      console.error("Error updating affiliate:", error);
    }
  };

  const handleCommissionRateChange = async (affiliateId: string, newRate: number) => {
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, commissionRate: newRate }),
      });

      if (res.ok) {
        setEditingRate(null);
        await fetchAffiliates();
      }
    } catch (error) {
      console.error("Error updating commission rate:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-zinc-400 italic">Loading affiliates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
          <div className="text-zinc-400 text-xs font-bold">Total Affiliates</div>
          <div className="text-2xl font-black text-zinc-950">{stats.totalAffiliates}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="text-green-600 text-xs font-bold">Active</div>
          <div className="text-2xl font-black text-green-700">{stats.activeAffiliates}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-blue-600 text-xs font-bold">Total Referrals</div>
          <div className="text-2xl font-black text-blue-700">{stats.totalReferrals}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <div className="text-yellow-600 text-xs font-bold">Pending Payouts</div>
          <div className="text-2xl font-black text-yellow-700">${stats.pendingPayouts.toFixed(2)}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="text-purple-600 text-xs font-bold">Total Paid</div>
          <div className="text-2xl font-black text-purple-700">${stats.totalCommissionsPaid.toFixed(2)}</div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["overview", "affiliates", "commissions"].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view as any)}
              className={`px-4 py-2 rounded-lg font-bold text-sm capitalize transition-colors ${
                activeView === view
                  ? "bg-red-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-400">Tiempo real (WebSocket)</span>
          </div>
          <span className="text-[10px] text-zinc-300">
            Última actualización: {lastUpdate.toLocaleTimeString("es-MX")}
          </span>
          <button
            onClick={fetchAll}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-lg transition-colors"
          >
            Refresh manual
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Top Affiliates */}
            <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100">
              <h3 className="text-lg font-black text-zinc-950 mb-4">Top Affiliates</h3>
              <div className="space-y-3">
                {affiliates
                  .sort((a, b) => b.totalEarnings - a.totalEarnings)
                  .slice(0, 5)
                  .map((affiliate) => (
                    <div key={affiliate._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold text-sm">{affiliate.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950 text-sm">{affiliate.name}</div>
                          <div className="text-zinc-400 text-xs">{affiliate.code}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">${affiliate.totalEarnings.toFixed(2)}</div>
                        <div className="text-zinc-400 text-xs">{affiliate.activeReferrals} referrals</div>
                      </div>
                    </div>
                  ))}
                {affiliates.length === 0 && (
                  <div className="text-center py-8 text-zinc-400 italic">No affiliates yet</div>
                )}
              </div>
            </div>

            {/* Recent Commissions */}
            <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100">
              <h3 className="text-lg font-black text-zinc-950 mb-4">Recent Commissions</h3>
              <div className="space-y-3">
                {commissions
                  .slice(0, 10)
                  .map((commission) => {
                    const affiliate = affiliates.find((a) => a._id === commission.affiliateId);
                    return (
                      <div key={commission._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-100">
                        <div>
                          <div className="font-bold text-zinc-950 text-sm">{affiliate?.name || "Unknown"}</div>
                          <div className="text-zinc-400 text-xs">{commission.plan} - {commission.period}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">${commission.amount.toFixed(2)}</div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            commission.status === "paid" ? "bg-green-100 text-green-700" :
                            commission.status === "approved" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {commission.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {commissions.length === 0 && (
                  <div className="text-center py-8 text-zinc-400 italic">No commissions yet</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === "affiliates" && (
          <motion.div
            key="affiliates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Affiliate</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Code</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Status</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Stripe</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Commission</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Referrals</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Earnings</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate._id} className="border-b border-zinc-100 hover:bg-white">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-bold text-xs">{affiliate.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-bold text-zinc-950 text-sm">{affiliate.name}</div>
                            <div className="text-zinc-400 text-xs">{affiliate.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-zinc-600">{affiliate.code}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          affiliate.status === "active" ? "bg-green-100 text-green-700" :
                          affiliate.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          affiliate.stripeAccountStatus === "active" ? "bg-green-100 text-green-700" :
                          affiliate.stripeAccountStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-zinc-100 text-zinc-500"
                        }`}>
                          {affiliate.stripeAccountStatus || "Not connected"}
                        </span>
                      </td>
                      <td className="p-4">
                        {editingRate === affiliate._id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={rateValue}
                              onChange={(e) => setRateValue(e.target.value)}
                              className="w-14 text-xs bg-white border border-zinc-200 rounded px-2 py-1 text-center"
                              min="0"
                              max="100"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleCommissionRateChange(affiliate._id, parseFloat(rateValue));
                                }
                                if (e.key === "Escape") setEditingRate(null);
                              }}
                            />
                            <span className="text-xs text-zinc-400">%</span>
                            <button
                              onClick={() => handleCommissionRateChange(affiliate._id, parseFloat(rateValue))}
                              className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingRate(null)}
                              className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingRate(affiliate._id); setRateValue(String(affiliate.commissionRate)); }}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold hover:bg-purple-200 transition-colors cursor-pointer"
                            title="Click to edit"
                          >
                            {affiliate.commissionRate}%
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-sm text-zinc-600">
                        {affiliate.activeReferrals} / {affiliate.totalReferrals}
                      </td>
                      <td className="p-4 font-bold text-green-600">${affiliate.totalEarnings.toFixed(2)}</td>
                      <td className="p-4">
                        <select
                          value={affiliate.status}
                          onChange={(e) => handleStatusChange(affiliate._id, e.target.value)}
                          className="text-xs bg-white border border-zinc-200 rounded px-2 py-1"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {affiliates.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-400 italic">No affiliates found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeView === "commissions" && (
          <motion.div
            key="commissions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Affiliate</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Plan</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Period</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Amount</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Status</th>
                    <th className="text-left p-4 text-zinc-500 text-xs font-bold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => {
                    const affiliate = affiliates.find((a) => a._id === commission.affiliateId);
                    return (
                      <tr key={commission._id} className="border-b border-zinc-100 hover:bg-white">
                        <td className="p-4">
                          <div className="font-bold text-zinc-950 text-sm">{affiliate?.name || "Unknown"}</div>
                          <div className="text-zinc-400 text-xs">{affiliate?.code}</div>
                        </td>
                        <td className="p-4 text-sm text-zinc-600 capitalize">{commission.plan}</td>
                        <td className="p-4 text-sm text-zinc-600">{commission.period}</td>
                        <td className="p-4 font-bold text-green-600">${commission.amount.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded font-bold ${
                            commission.status === "paid" ? "bg-green-100 text-green-700" :
                            commission.status === "approved" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-zinc-600">{new Date(commission.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400 italic">No commissions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}