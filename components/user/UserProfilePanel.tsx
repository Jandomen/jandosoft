"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface UserProfilePanelProps {
  user: {
    email: string;
    name?: string;
    subscription: string | null;
    subscriptionExpiry: Date | null;
    isSuspended: boolean;
  };
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onLogout: () => void;
}

export default function UserProfilePanel({
  user,
  apiFetch,
  showToast,
  onLogout,
}: UserProfilePanelProps) {
  const { t } = useLanguage();

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

  const inputClass = "w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-600/10 transition-all";
  const labelClass = "text-xs font-medium text-zinc-400 mb-1.5 block";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-4 md:py-10 space-y-8"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-950">{t("profile.title")}</h2>
          <p className="text-xs text-zinc-400">{user.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-semibold text-zinc-950 tracking-tight">{t("register.name_placeholder")}</h3>
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
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
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {t("profile.save")}
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-semibold text-zinc-950 tracking-tight flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-500" />
          {t("profile.change_password")}
        </h3>
        <div className="space-y-4">
          <div>
            <p className={labelClass}>{t("profile.current_password")}</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <p className={labelClass}>{t("profile.new_password")}</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <p className={labelClass}>{t("profile.confirm_password")}</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="px-5 py-3 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {t("profile.change_password")}
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-200 p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-semibold text-red-600 tracking-tight flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          {t("profile.delete_account")}
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
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
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-red-700">
                {t("profile.delete_confirm_btn")} — escribe <strong>ELIMINAR</strong> e ingresa tu contraseña para confirmar.
              </p>
            </div>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full bg-zinc-50 p-3 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all uppercase tracking-widest text-center font-bold"
            />
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              <input
                type={showDeletePassword ? "text" : "password"}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t("profile.current_password")}
                className="w-full bg-zinc-50 p-3 pl-9 rounded-lg border border-zinc-100 outline-none text-sm focus:bg-white focus:border-red-200 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowDeletePassword(!showDeletePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
              >
                {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); setDeletePassword(""); setDeleteError(""); }}
                disabled={deleting}
                className="flex-1 py-3 bg-zinc-50 text-zinc-600 rounded-lg text-xs font-semibold hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-3.5 h-3.5" />
                {t("action.cancel")}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "ELIMINAR" || !deletePassword || deleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {t("profile.delete_confirm_btn")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
