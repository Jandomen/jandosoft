import { Package } from "lucide-react";

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" ");

const GRADIENTS = [
  "from-red-100 to-rose-200",
  "from-blue-100 to-indigo-200",
  "from-emerald-100 to-teal-200",
  "from-amber-100 to-orange-200",
  "from-violet-100 to-purple-200",
  "from-cyan-100 to-sky-200",
  "from-pink-100 to-fuchsia-200",
  "from-lime-100 to-green-200",
];

export default function ProductDefaultImage({ name, className }: { name?: string; className?: string }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  const gradient = GRADIENTS[(name?.length || 0) % GRADIENTS.length];

  return (
    <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", gradient, className)}>
      <div className="text-center">
        <Package className="w-8 h-8 text-white/60 mx-auto mb-1 drop-shadow-sm" />
        <span className="text-lg font-black text-white/80 italic drop-shadow-sm block leading-none">{initial}</span>
      </div>
    </div>
  );
}
