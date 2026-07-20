"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Save,
  X,
  Zap,
  Calendar,
  CreditCard,
  AlertCircle,
  Crown,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/components/public/ThemeProvider";
import { LanguageCarousel } from "@/components/ui/LanguageCarousel";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface UserProfilePanelProps {
  user: {
    email: string;
    name?: string;
    subscription: string | null;
    subscriptionExpiry: Date | null;
    isSuspended: boolean;
    createdAt?: Date | null;
  };
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onLogout: () => void;
  onNavigateToPricing?: () => void;
}

export default function UserProfilePanel({
  user,
  apiFetch,
  showToast,
  onLogout,
  onNavigateToPricing,
}: UserProfilePanelProps) {
  const { t } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [name, setName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [allPlans, setAllPlans] = useState<any[]>(PLANS);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.plans?.length > 0) setAllPlans(d.plans);
      })
      .catch(() => {});
  }, []);

  const getPlanName = (planId: string | null) => {
    if (!planId || planId === "free") return t("user.free");
    const found = allPlans.find((p: any) => p.id === planId);
    return found ? t(found.nameKey ?? found.name) : planId.replace(/^plan_/i, "").replace(/_/g, " ");
  };

  const getPlanPrice = (planId: string | null) => {
    if (!planId || planId === "free") return 0;
    const found = allPlans.find((p: any) => p.id === planId);
    return found?.priceUsd || found?.price || 0;
  };

  const expiryDate = user.subscriptionExpiry
    ? new Date(user.subscriptionExpiry)
    : null;
  const isExpired = expiryDate ? new Date() > expiryDate : false;
  const isCanceled = (user as any).subscriptionStatus === "canceled";
  const hasPaidPlan =
    user.subscription && user.subscription !== "free" && !isExpired && !isCanceled;
  const isFree = !user.subscription || user.subscription === "free" || isExpired || isCanceled;

  const createdAtDate = user.createdAt ? new Date(user.createdAt) : null;

  const handleSaveName = async () => {
    if (!name.trim() || name === user.name) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error");
      }
      showToast(t("profile.saved_toast"), "success");
    } catch (e: any) {
      showToast(e.message || t("status.error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError(t("profile.current_password"));
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError(t("status.password_too_short"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.password_mismatch"));
      return;
    }
    setChangingPassword(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("status.error"));
      }
      showToast(t("profile.password_changed_toast"), "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setPasswordError(e.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (deleteConfirmText !== "ELIMINAR") return;
    if (!deletePassword) {
      setDeleteError(t("profile.delete_confirm_password"));
      return;
    }
    setDeleting(true);
    try {
      const res = await apiFetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("profile.delete_error"));
      }
      showToast(t("profile.delete_success_toast"), "success");
      setTimeout(() => onLogout(), 1500);
    } catch (e: any) {
      setDeleteError(e.message);
      setDeleting(false);
    }
  };

  const handleCancelPlan = async () => {
    setShowCancelConfirm(false);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immediately: false }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      showToast(data.message || "Plan cancelado correctamente", "success");
    } catch {
      showToast("Error al cancelar", "error");
    }
  };

  const inputClass =
    "w-full bg-zinc-50 dark:bg-zinc-800 p-3 pl-9 rounded-lg border border-zinc-100 dark:border-zinc-700 outline-none text-sm focus:bg-white dark:focus:bg-zinc-700 focus:border-red-200 dark:focus:border-red-500 focus:ring-2 focus:ring-red-600/10 dark:focus:ring-red-500/20 transition-all dark:text-white dark:placeholder:text-zinc-500";
  const labelClass = "text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1.5 block";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-4 md:py-10 space-y-8"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            {t("profile.title")}
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{user.email}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
          <Crown className="w-4 h-4 text-red-500 dark:text-red-400" />
          {t("user.my_plan") || "Mi Plan"}
        </h3>

        <div
          className={cn(
            "rounded-xl p-5 border",
            hasPaidPlan
              ? "bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-950/20 border-red-100 dark:border-red-900/30"
              : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700"
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    hasPaidPlan
                      ? "bg-red-600 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  {hasPaidPlan
                    ? getPlanName(user.subscription)
                    : t("user.free")}
                </span>
                {hasPaidPlan && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {t("user.active") || "Activo"}
                  </span>
                )}
                {isCanceled && !isExpired && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {t("user.cancelled") || "Cancelado"}
                  </span>
                )}
                {isExpired && (
                  <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">
                    {t("user.expired") || "Expirado"}
                  </span>
                )}
              </div>
              {hasPaidPlan && (
                <p className="text-lg font-black text-zinc-950 dark:text-white mt-2">
                  ${getPlanPrice(user.subscription)}{" "}
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    USD/mes
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {createdAtDate && (
              <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                <span>
                  {t("user.member_since") || "Miembro desde"}:{" "}
                  <strong className="text-zinc-700 dark:text-zinc-200">
                    {createdAtDate.toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </strong>
                </span>
              </div>
            )}
            {expiryDate && hasPaidPlan && (
              <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                <span>
                  {t("user.expires") || "Expira"}:{" "}
                  <strong className="text-zinc-700 dark:text-zinc-200">
                    {expiryDate.toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isFree ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onNavigateToPricing}
              className="flex-1 px-5 py-3 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              {t("user.get_plan") || "Obtener Plan"}
            </motion.button>
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onNavigateToPricing}
                className="flex-1 px-5 py-3 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                {t("user.update_plan") || "Actualizar Plan"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCancelConfirm(true)}
                className="px-5 py-3 bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex items-center justify-center gap-2"
              >
                {t("user.cancel_plan") || "Cancelar Plan"}
              </motion.button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight">
          {t("register.name_placeholder")}
        </h3>
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-600" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveName}
            disabled={saving || !name.trim() || name === user.name}
            className="px-5 py-3 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {t("profile.save")}
          </motion.button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-500 dark:text-red-400" />
          {t("profile.change_password")}
        </h3>
        <div className="space-y-4">
          <div>
            <p className={labelClass}>{t("profile.current_password")}</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-600" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400"
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <p className={labelClass}>{t("profile.new_password")}</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-600" />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400"
              >
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <p className={labelClass}>{t("profile.confirm_password")}</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-600" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {passwordError && (
            <p className="text-xs font-medium text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {passwordError}
            </p>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleChangePassword}
            disabled={
              changingPassword ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            className="px-5 py-3 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {changingPassword ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            {t("profile.change_password")}
          </motion.button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-4 h-4 text-red-500 dark:text-red-400" />
          {t("profile.preferences") || "Preferencias"}
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-2">{t("profile.language") || "Idioma"}</p>
            <LanguageCarousel />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-2">{t("profile.theme") || "Tema"}</p>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all w-full"
            >
              {mounted && theme === "dark" ? (
                <>
                  <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {t("profile.light_mode") || "Modo claro"}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  {t("profile.dark_mode") || "Modo oscuro"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/30 p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 tracking-tight flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          {t("profile.delete_account")}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {t("profile.delete_warning")}
        </p>
        {!showDeleteConfirm ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-3 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("profile.delete_account")}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4"
          >
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-red-700 dark:text-red-300">
                {t("profile.delete_confirm_btn")} — escribe{" "}
                <strong>ELIMINAR</strong> e ingresa tu contraseña para
                confirmar.
              </p>
            </div>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700 outline-none text-sm focus:bg-white dark:focus:bg-zinc-700 focus:border-red-200 dark:focus:border-red-500 transition-all uppercase tracking-widest text-center font-bold dark:text-white"
            />
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-600" />
              <input
                type={showDeletePassword ? "text" : "password"}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t("profile.current_password")}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 pl-9 rounded-lg border border-zinc-100 dark:border-zinc-700 outline-none text-sm focus:bg-white dark:focus:bg-zinc-700 focus:border-red-200 dark:focus:border-red-500 transition-all dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowDeletePassword(!showDeletePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400"
              >
                {showDeletePassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {deleteError && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setDeletePassword("");
                  setDeleteError("");
                }}
                disabled={deleting}
                className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-3.5 h-3.5" />
                {t("action.cancel")}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDeleteAccount}
                disabled={
                  deleteConfirmText !== "ELIMINAR" || !deletePassword || deleting
                }
                className="flex-1 py-3 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {t("profile.delete_confirm_btn")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 max-w-sm w-full space-y-5 shadow-2xl border border-zinc-100 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black italic text-zinc-950 dark:text-white uppercase">
                  {t("user.cancel_plan") || "Cancelar Plan"}
                </h3>
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 italic">
                  {t("user.cancel_plan_confirm") ||
                    "Se cancelará al final del periodo de facturación. No se realiza reembolso."}
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelPlan}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black italic text-xs hover:bg-red-700 transition-all"
                >
                  {t("user.cancel_plan_confirm_yes") || "Sí, cancelar"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl font-black italic text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
                >
                  {t("user.cancel_plan_confirm_no") || "No, mantener"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
