"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ScanBarcode, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BarcodeScannerProps {
  slug: string;
  onClose?: () => void;
}

export default function BarcodeScanner({ slug, onClose }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [looking, setLooking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any | null>(null);
  const animRef = useRef<number>(0);
  const router = useRouter();

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const lookupBarcode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLooking(true);
    setError("");
    try {
      const res = await fetch(`/api/s/${slug}/products?barcode=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          stopCamera();
          setIsOpen(false);
          router.push(`/s/${slug}/products/${data.product.id}`);
          return;
        }
      }
      setError("Producto no encontrado con ese código");
    } catch {
      setError("Error al buscar producto");
    }
    setLooking(false);
  }, [slug, router, stopCamera]);

  const scanLoop = useCallback(async () => {
    if (!videoRef.current || !scannerRef.current) return;
    try {
      const barcodes = await scannerRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        lookupBarcode(code);
        return;
      }
    } catch {}
    animRef.current = requestAnimationFrame(scanLoop);
  }, [lookupBarcode]);

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if ("BarcodeDetector" in window) {
        scannerRef.current = new (window as any).BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
        setIsScanning(true);
        animRef.current = requestAnimationFrame(scanLoop);
      } else {
        setIsScanning(true);
      }
    } catch {
      setError("No se pudo acceder a la cámara");
      setIsScanning(true);
    }
  }, [scanLoop]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleOpen = () => {
    setIsOpen(true);
    setError("");
    setManualCode("");
    setTimeout(startCamera, 100);
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all"
      >
        <ScanBarcode className="w-4 h-4" />
        Escanear Código
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <ScanBarcode className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black italic text-zinc-950 dark:text-zinc-100 uppercase">Escanear Código</h3>
                </div>
                <button onClick={handleClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="relative aspect-[4/3] bg-zinc-950 rounded-2xl overflow-hidden">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-red-500 rounded-xl relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
                        <motion.div
                          className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-lg shadow-red-500/50"
                          animate={{ top: ["10%", "85%", "10%"] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                    </div>
                  )}
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
                      <div className="text-center">
                        <Camera className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">Cámara no disponible</p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-xs font-bold text-rose-600 text-center">{error}</div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center px-4">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-bold uppercase">o ingresa manualmente</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && lookupBarcode(manualCode)}
                    placeholder="Código de barras..."
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm font-medium focus:border-red-300 transition-colors"
                  />
                  <button
                    onClick={() => lookupBarcode(manualCode)}
                    disabled={!manualCode.trim() || looking}
                    className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 text-center">
                  Apunta la cámara al código de barras del producto para ver sus detalles
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
