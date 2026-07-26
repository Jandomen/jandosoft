"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import { LanguageCarousel } from "@/components/ui/LanguageCarousel";
import { ArrowLeft, Copy, LogOut, ExternalLink, Mail, CheckCircle2, Loader2, Download, Link2, Unlink } from "lucide-react";

interface Affiliate {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
  commissionRate: number;
  stripeAccountStatus: string;
  totalEarnings: number;
  pendingBalance: number;
  paidBalance: number;
  totalReferrals: number;
  activeReferrals: number;
}

interface Referral {
  id: string;
  email: string;
  plan: string;
  startDate: string;
  totalCommissions: number;
}

interface Commission {
  id: string;
  amount: number;
  percentage: number;
  plan: string;
  planPrice: number;
  period: string;
  status: string;
  createdAt: string;
}

interface Payout {
  id: string;
  amount: number;
  method: string;
  status: string;
  receiptNumber?: string;
  processedAt?: string;
  createdAt: string;
}

export default function AffiliatesPage() {
  const { t } = useLanguage();
  const { showToast, ToastComponent } = useToast();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "referrals" | "commissions" | "payout">("dashboard");
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: "", phone: "" });
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [verifyResending, setVerifyResending] = useState(false);
  const [verifyResent, setVerifyResent] = useState(false);

  useEffect(() => {
    checkAffiliateStatus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      showToast("Stripe conectado correctamente", "success");
      window.history.replaceState({}, "", "/affiliates");
    }
    if (params.get("refresh") === "1") {
      showToast("Error al conectar Stripe, intenta de nuevo", "error");
      window.history.replaceState({}, "", "/affiliates");
    }
  }, []);

  const checkAffiliateStatus = async () => {
    try {
      const session = localStorage.getItem("jandosession");
      if (!session) {
        setLoading(false);
        setShowRegister(true);
        return;
      }

      const { email } = JSON.parse(session);
      setUserEmail(email);

      const [affiliateRes, userRes] = await Promise.all([
        fetch(`/api/affiliates/check?email=${encodeURIComponent(email)}`),
        fetch(`/api/user?email=${encodeURIComponent(email)}`),
      ]);

      const affiliateData = await affiliateRes.json();
      if (affiliateData.success && affiliateData.affiliate) {
        localStorage.setItem("affiliateId", affiliateData.affiliate.id);
        setUserName(affiliateData.affiliate.name);
        await fetchDashboard(affiliateData.affiliate.id);
      } else {
        setLoading(false);
        setShowRegister(true);
      }

      const userData = await userRes.json();
      if (userData.user) {
        setEmailVerified(userData.user.emailVerified ?? false);
      }
    } catch (error) {
      console.error("Error checking affiliate status:", error);
      setLoading(false);
    }
  };

  const fetchDashboard = async (affiliateId: string) => {
    try {
      const res = await fetch(`/api/affiliates/dashboard?affiliateId=${affiliateId}`);
      const data = await res.json();
      if (data.success) {
        setAffiliate(data.affiliate);
        setReferrals(data.activeReferrals || []);
        setCommissions(data.recentCommissions || []);
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async (affiliateId: string) => {
    try {
      const res = await fetch(`/api/affiliates/dashboard?affiliateId=${affiliateId}`);
      const data = await res.json();
      if (data.success && data.payouts) {
        setPayouts(data.payouts);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
    }
  };

  const downloadReceipt = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/affiliates/receipts/${payoutId}`);
      if (!res.ok) throw new Error("Error downloading receipt");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Recibo_Afiliado_${payoutId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast("Error al descargar el recibo", "error");
    }
  };

  const handleRegister = async () => {
    try {
      if (!userEmail) {
        showToast(t("affiliate.login_required"), "error");
        return;
      }

      const res = await fetch("/api/affiliates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: registerForm.name || userName || userEmail.split("@")[0],
          phone: registerForm.phone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("affiliateId", data.affiliate.id);
        setShowRegister(false);
        await fetchDashboard(data.affiliate.id);
      } else {
        showToast(data.error || t("affiliate.registration_failed"), "error");
      }
    } catch (error) {
      console.error("Error registering:", error);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const affiliateId = affiliate?.id;
      if (!affiliateId) return;

      const res = await fetch("/api/affiliates/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || t("affiliate.stripe_connect_error"), "error");
      }
    } catch (error) {
      showToast(t("affiliate.stripe_connect_error"), "error");
    }
  };

  const handleWithdraw = async () => {
    try {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount < 50) {
        showToast(t("affiliate.min_withdrawal_alert"), "error");
        return;
      }

      setWithdrawing(true);
      const res = await fetch("/api/affiliates/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: affiliate?.id,
          amount,
          method: "stripe",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(t("affiliate.withdraw_success"), "success");
        setWithdrawAmount("");
        await fetchDashboard(affiliate!.id);
      } else {
        showToast(data.error || t("affiliate.withdraw_failed"), "error");
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifyResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (data.success) setVerifyResent(true);
    } catch {}
    setVerifyResending(false);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/ref/${affiliate?.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      {/* Header */}
      <header className="h-16 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-4 md:px-10 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = "/"}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <span className="text-lg font-wallpoet tracking-[0.2em] text-red-600">JANDOSOFT</span>
          <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 hidden md:inline">/ {t("affiliate.nav")}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden md:inline">{userEmail}</span>
          <LanguageCarousel />
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-zinc-400 dark:text-zinc-500 italic">{t("status.loading")}</div>
          </div>
        ) : showRegister ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm mt-8"
          >
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 rounded-xl mx-auto flex items-center justify-center mb-6">
              <span className="text-2xl">💰</span>
            </div>
            <h1 className="text-2xl font-black italic text-zinc-950 dark:text-zinc-100 text-center mb-2">{t("affiliate.title")}</h1>
            <p className="text-zinc-400 dark:text-zinc-500 text-center mb-6">{t("affiliate.subtitle")}</p>

            <div className="space-y-4">
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.email")}</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-zinc-950 dark:text-zinc-100 mt-1 opacity-60"
                />
              </div>
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.name")}</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-zinc-950 dark:text-zinc-100 mt-1 focus:bg-white dark:focus:bg-zinc-700 focus:border-red-200 dark:focus:border-red-700 outline-none transition-all"
                  placeholder={t("affiliate.name")}
                />
              </div>
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.phone")}</label>
                <input
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-zinc-950 dark:text-zinc-100 mt-1 focus:bg-white dark:focus:bg-zinc-700 focus:border-red-200 dark:focus:border-red-700 outline-none transition-all"
                  placeholder="+1 234 567 890"
                />
              </div>

              <button
                onClick={handleRegister}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm"
              >
                {t("affiliate.register")}
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Email Verification Banner */}
            {emailVerified === false && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border border-rose-200 dark:border-rose-800 p-4 sm:p-5 rounded-2xl mb-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black italic text-rose-900 dark:text-rose-300">{t("user.verify_email_title")}</p>
                      <p className="text-[10px] font-medium text-rose-600 dark:text-rose-400 italic">{t("user.verify_warning")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {verifyResent ? (
                      <span className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-bold italic">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t("affiliate.resent")}
                      </span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResendVerification}
                        disabled={verifyResending}
                        className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold italic hover:bg-rose-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                      >
                        {verifyResending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        {t("user.resend_verification")}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black italic text-zinc-950 dark:text-zinc-100">{t("affiliate.dashboard")}</h1>
                <p className="text-zinc-400 dark:text-zinc-500">{t("affiliate.welcome_back")}, {affiliate?.name}</p>
              </div>
              <div className="flex gap-2">
                {(["dashboard", "referrals", "commissions", "payout"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-red-600 text-white"
                        : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {t(`affiliate.${tab}`)}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <div className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">{t("affiliate.total_earnings")}</div>
                      <div className="text-3xl font-black text-green-600">${affiliate?.totalEarnings?.toFixed(2) || "0.00"}</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <div className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">{t("affiliate.pending_balance")}</div>
                      <div className="text-3xl font-black text-yellow-600">${affiliate?.pendingBalance?.toFixed(2) || "0.00"}</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <div className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">{t("affiliate.active_referrals")}</div>
                      <div className="text-3xl font-black text-blue-600">{affiliate?.activeReferrals || 0}</div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <div className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">{t("affiliate.commission_rate")}</div>
                      <div className="text-3xl font-black text-red-600">{affiliate?.commissionRate || 20}%</div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-lg font-black text-zinc-950 dark:text-zinc-100 mb-4">{t("affiliate.your_link")}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                        {`${typeof window !== "undefined" ? window.location.origin : ""}/ref/${affiliate?.code}`}
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className={`px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 ${
                          copied ? "bg-green-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {copied ? t("affiliate.copied") : <><Copy className="w-4 h-4" /> {t("affiliate.copy")}</>}
                      </button>
                    </div>
                    <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-2">{t("affiliate.code")}: <span className="font-mono font-bold">{affiliate?.code}</span></p>
                  </div>

                  {affiliate?.stripeAccountStatus === "active" ? (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <Link2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-green-700 dark:text-green-500">{t("affiliate.stripe_connected")}</h3>
                          <p className="text-green-600 dark:text-green-400 text-sm">{t("affiliate.stripe_connected_desc")}</p>
                        </div>
                      </div>
                    </div>
                  ) : affiliate?.stripeAccountStatus === "pending" ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black text-yellow-700 dark:text-yellow-500 mb-1">{t("affiliate.stripe_pending")}</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t("affiliate.stripe_pending_desc")}</p>
                        </div>
                        <button
                          onClick={handleConnectStripe}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> {t("affiliate.complete_setup")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                      <h3 className="text-lg font-black text-yellow-700 dark:text-yellow-500 mb-2">{t("affiliate.connect_stripe")}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">{t("affiliate.connect_stripe_desc")}</p>
                      <button
                        onClick={handleConnectStripe}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" /> {t("affiliate.connect_button")}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "referrals" && (
                <motion.div
                  key="referrals"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">Email</th>
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.plan")}</th>
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.start_date")}</th>
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.earnings")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-zinc-400 dark:text-zinc-500 italic">
                              {t("affiliate.no_referrals")}
                            </td>
                          </tr>
                        ) : (
                          referrals.map((r) => (
                            <tr key={r.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                              <td className="p-4 text-zinc-950 dark:text-zinc-100 font-medium">{r.email}</td>
                              <td className="p-4 text-zinc-600 dark:text-zinc-400 capitalize">{r.plan}</td>
                              <td className="p-4 text-zinc-600 dark:text-zinc-400">{new Date(r.startDate).toLocaleDateString()}</td>
                              <td className="p-4 text-green-600 font-bold">${r.totalCommissions?.toFixed(2) || "0.00"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === "commissions" && (
                <motion.div
                  key="commissions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.period")}</th>
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.plan")}</th>
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.amount")}</th>
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.status")}</th>
                          <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.date")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-400 dark:text-zinc-500 italic">
                              {t("affiliate.no_commissions")}
                            </td>
                          </tr>
                        ) : (
                          commissions.map((c) => (
                            <tr key={c.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                              <td className="p-4 text-zinc-950 dark:text-zinc-100 font-medium">{c.period}</td>
                              <td className="p-4 text-zinc-600 dark:text-zinc-400 capitalize">{c.plan}</td>
                              <td className="p-4 text-green-600 font-bold">${c.amount?.toFixed(2) || "0.00"}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  c.status === "paid" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                  c.status === "approved" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                }`}>
                                  {t(`affiliate.${c.status}`)}
                                </span>
                              </td>
                              <td className="p-4 text-zinc-600 dark:text-zinc-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === "payout" && (
                <motion.div
                  key="payout"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-lg font-black text-zinc-950 dark:text-zinc-100 mb-4">{t("affiliate.request_withdrawal")}</h3>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={t("affiliate.min_withdrawal")}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-zinc-950 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-700 focus:border-red-200 dark:focus:border-red-700 outline-none transition-all"
                        min="50"
                      />
                      <button
                        onClick={handleWithdraw}
                        disabled={withdrawing || !affiliate?.stripeAccountStatus}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                      >
                        {withdrawing ? t("affiliate.processing") : t("affiliate.withdraw")}
                      </button>
                    </div>
                    <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-2">
                      {t("affiliate.available")}: ${affiliate?.pendingBalance?.toFixed(2) || "0.00"} | {t("affiliate.min_withdrawal")}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-lg font-black text-zinc-950 dark:text-zinc-100 mb-4">{t("affiliate.payout_history")}</h3>
                    {payouts.length === 0 ? (
                      <div className="text-zinc-400 dark:text-zinc-500 italic text-sm">
                        {t("affiliate.payout_history_empty")}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                              <th className="text-left p-3 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.receipt")}</th>
                              <th className="text-left p-3 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.date")}</th>
                              <th className="text-left p-3 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.method")}</th>
                              <th className="text-left p-3 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.amount")}</th>
                              <th className="text-left p-3 text-zinc-500 dark:text-zinc-400 text-xs font-bold">{t("affiliate.status")}</th>
                              <th className="text-left p-3 text-zinc-500 dark:text-zinc-400 text-xs font-bold"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {payouts.map((p) => (
                              <tr key={p.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                <td className="p-3 text-zinc-950 dark:text-zinc-100 font-mono text-sm">{p.receiptNumber || "-"}</td>
                                <td className="p-3 text-zinc-600 dark:text-zinc-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td className="p-3 text-zinc-600 dark:text-zinc-400 capitalize">{p.method}</td>
                                <td className="p-3 text-green-600 font-bold">${p.amount?.toFixed(2) || "0.00"}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    p.status === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                    p.status === "failed" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                                    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                  }`}>
                                    {t(`affiliate.${p.status}`)}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {p.status === "completed" && (
                                    <button
                                      onClick={() => downloadReceipt(p.id)}
                                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                      title={t("affiliate.download_receipt")}
                                    >
                                      <Download className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      {ToastComponent}
    </div>
  );
}
