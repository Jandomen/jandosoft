"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function ReferralPage() {
  const params = useParams();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      localStorage.setItem("referralCode", code);
      window.location.href = `/?ref=${code}`;
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
      <div className="text-white text-xl">Redirecting...</div>
    </div>
  );
}