"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, Trash2, Plus, Mail, Lock, User, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormField {
  id: string;
  type: "text" | "email" | "password" | "textarea" | "select" | "checkbox";
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface FormConfig {
  endpoint: string;
  method: string;
  submitLabel: string;
  fields: FormField[];
}

interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  setValue: (name: string, value: any) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormIndividualInput = ({ type, name, label, placeholder, required, isPreview, value, onChange }: any) => {
  const [internalValue, setInternalValue] = useState("");
  const currentVal = value !== undefined ? value : internalValue;

  const handleChange = (e: any) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    else setInternalValue(val);
  };

  const baseClasses = cn(
    "w-full bg-white border rounded-2xl p-4 text-xs font-semibold outline-none transition-all italic tracking-tight placeholder:text-zinc-300 shadow-sm",
    "border-zinc-100 focus:ring-4 focus:ring-red-600/10 focus:border-red-300",
    !isPreview && "pointer-events-none select-none"
  );

  return (
    <div className="space-y-2 w-full group animate-in slide-in-from-left-2 duration-300">
      {label && <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2 italic group-focus-within:text-red-600 transition-colors">{label}</label>}
      <div className="relative">
        {type === "email" && <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-red-600 transition-colors" />}
        {type === "password" && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-red-600 transition-colors" />}

        {type === "textarea" ? (
          <textarea className={cn(baseClasses, "min-h-[120px] resize-none")} placeholder={placeholder} value={currentVal} onChange={handleChange} />
        ) : (
          <input type={type} className={baseClasses} placeholder={placeholder} value={currentVal} onChange={handleChange} />
        )}
      </div>
    </div>
  );
};

export const FormContainer = ({ config, children, onSuccess, isPreview }: any) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    config.fields.forEach((field: FormField) => {
      if (field.required && !values[field.name]) {
        newErrors[field.name] = "Este campo es obligatorio";
      } else if (field.type === "email" && values[field.name] && !/\S+@\S+\.\S+/.test(values[field.name])) {
        newErrors[field.name] = "Email no válido";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPreview) return;
    if (!validate()) return;

    setStatus("loading");
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus("success");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-10 bg-emerald-50 border border-emerald-100 rounded-[3rem] text-center space-y-6 shadow-inner italic">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-900/10"><CheckCircle2 className="w-10 h-10" /></div>
        <h4 className="text-xl font-black text-emerald-950 uppercase italic leading-none">¡Envío Completado!</h4>
        <button onClick={() => setStatus("idle")} className="px-8 py-3 bg-white text-emerald-600 rounded-xl text-[10px] font-black italic uppercase shadow-sm">NUEVO FORMULARIO</button>
      </div>
    );
  }

  return (
    <FormContext.Provider value={{ values, errors, setValue }}>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 p-1 bg-transparent">
        <div className="space-y-4">
          {config.fields.map((field: FormField) => (
            <FormInput key={field.id} {...field} />
          ))}
        </div>
        <button disabled={status === "loading" || !isPreview} type="submit" className={cn("w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs italic shadow-xl shadow-red-100 hover:bg-zinc-950 transition-all flex items-center justify-center gap-3 group uppercase tracking-widest", !isPreview && "opacity-50 grayscale cursor-not-allowed")}>
          {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : config.submitLabel || "ENVIAR DATOS"}
        </button>
      </form>
    </FormContext.Provider>
  );
};

const FormInput = ({ type, name, label, placeholder, options }: FormField) => {
  const context = useContext(FormContext);
  if (!context) return null;
  const { values, errors, setValue } = context;

  const baseClasses = cn(
    "w-full bg-white border rounded-2xl p-4 text-xs font-semibold outline-none transition-all italic tracking-tight placeholder:text-zinc-300 shadow-sm",
    errors[name] ? "border-rose-300 ring-4 ring-rose-600/5 bg-rose-50/20" : "border-zinc-100 focus:ring-4 focus:ring-red-600/10 focus:border-red-300"
  );

  return (
    <div className="space-y-2 w-full group animate-in slide-in-from-left-2 duration-300">
      {label && <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2 italic group-focus-within:text-red-600 transition-colors uppercase">{label}</label>}
      <input type={type} className={baseClasses} placeholder={placeholder} value={values[name] || ""} onChange={e => setValue(name, e.target.value)} />
      {errors[name] && <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase italic ml-2 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors[name]}</div>}
    </div>
  );
};
