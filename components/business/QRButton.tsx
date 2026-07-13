"use client";

import { useState, useEffect } from "react";
import { QrCode, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCodeLib from "qrcode";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function QRButton({ url, label }: { url: string; label?: string }) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (show) {
      QRCodeLib.toDataURL(url, { width: 300, margin: 2, color: { dark: "#18181b", light: "#ffffff" } }).then(setQrDataUrl);
    }
  }, [show, url]);

  const download = () => {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${label || "code"}.png`;
    a.click();
  };

  return (
    <>
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShow(true)} className="p-1 text-zinc-300 hover:text-zinc-600 transition-all" title={t("qr.title")}>
        <QrCode className="w-3 h-3" />
      </motion.button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShow(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-6 shadow-4xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShow(false)} className="absolute top-4 right-4 p-2 hover:bg-zinc-50 rounded-xl"><X className="w-4 h-4 text-zinc-400" /></button>
              {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-48 h-48 mx-auto" />}
              <motion.button whileTap={{ scale: 0.95 }} onClick={download} className="mt-4 w-full py-3 bg-red-600 text-white rounded-xl font-black italic hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2 text-xs">
                <Download className="w-3.5 h-3.5" /> {t("qr.download")}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
