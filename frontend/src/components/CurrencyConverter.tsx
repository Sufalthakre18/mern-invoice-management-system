"use client";
import { useState } from "react";
import api from "@/lib/api";

interface Props {
  invoiceId: string;
  currentCurrency: string;
  total: number;
}

const SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

export default function CurrencyConverter({ invoiceId, currentCurrency, total }: Props) {
  const [targetCurrency, setTargetCurrency] = useState(currentCurrency === "INR" ? "USD" : "INR");
  const [result, setResult] = useState<{ amount: number; currency: string; rate: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const convert = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.get(`/invoices/${invoiceId}/convert?to=${targetCurrency}`);
      setResult(res.data.converted);
      // Also store rate
      setResult({ ...res.data.converted, rate: res.data.rate });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  const available = CURRENCIES.filter((c) => c !== currentCurrency);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-800">
        <h3 className="text-sm font-semibold text-stone-200">Currency Converter</h3>
        <p className="text-xs text-stone-600 mt-0.5">Convert invoice total</p>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* From */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">From ({currentCurrency})</span>
          <span className="font-mono text-stone-300">
            {SYM[currentCurrency]}{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* To selector */}
        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Convert to</label>
          <div className="flex gap-1.5 flex-wrap">
            {available.map((c) => (
              <button
                key={c}
                onClick={() => { setTargetCurrency(c); setResult(null); setError(""); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  targetCurrency === c
                    ? "bg-amber-400 text-stone-950"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-lg">
            <p className="text-xs text-stone-500 mb-1">Converted Amount</p>
            <p className="font-mono text-lg font-bold text-amber-400">
              {SYM[result.currency]}{result.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-stone-600 mt-1 font-mono">
              1 {currentCurrency} = {(result as { amount: number; currency: string; rate: number }).rate?.toFixed(6)} {targetCurrency}
            </p>
          </div>
        )}

        {error && (
          <p className="text-rose-400 text-xs">{error}</p>
        )}

        <button
          onClick={convert}
          disabled={loading}
          className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border border-stone-500 border-t-stone-200 rounded-full animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Convert to {targetCurrency}
            </>
          )}
        </button>
      </div>
    </div>
  );
}