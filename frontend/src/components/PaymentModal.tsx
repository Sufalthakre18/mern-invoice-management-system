"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";

interface Props {
  invoiceId: string;
  balanceDue: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentForm {
  amount: number;
  method: string;
  paymentDate: string;
  note: string;
}

const SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };

export default function PaymentModal({ invoiceId, balanceDue, currency, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sym = SYM[currency] || currency;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PaymentForm>({
    defaultValues: {
      method: "UPI",
      paymentDate: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const currentAmount = watch("amount");

  const fillPercent = (pct: number) => {
    setValue("amount", parseFloat(((balanceDue * pct) / 100).toFixed(2)), { shouldValidate: true });
  };

  const onSubmit = async (data: PaymentForm) => {
    setLoading(true);
    setError("");
    try {
      await api.post(`/invoices/${invoiceId}/payments`, {
        amount: Number(data.amount),
        method: data.method,
        paymentDate: data.paymentDate,
        note: data.note || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-stone-900 border border-stone-800 rounded-t-2xl sm:rounded-2xl animate-scale-in">

    
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-stone-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-stone-800">
          <div>
            <h2 className="font-semibold text-stone-100 text-base">Record Payment</h2>
            <p className="text-stone-500 text-xs mt-0.5 font-mono">
              Outstanding: {sym}{balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-rose-950/60 border border-rose-900/60 rounded-lg text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 text-sm font-mono">{sym}</span>
              <input
                type="number"
                step="0.01"
                placeholder={balanceDue.toFixed(2)}
                className={`w-full bg-stone-950 border rounded-lg pl-9 pr-4 py-3 text-stone-100 text-sm font-mono placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors ${errors.amount ? "border-rose-500" : "border-stone-800"}`}
                {...register("amount", {
                  required: "Amount is required",
                  min: { value: 0.01, message: "Must be > 0" },
                  max: { value: balanceDue, message: `Cannot exceed ${sym}${balanceDue}` },
                  valueAsNumber: true,
                })}
              />
            </div>
            {errors.amount && <p className="text-rose-400 text-xs mt-1.5">{errors.amount.message}</p>}

            <div className="flex gap-2 mt-2.5">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => fillPercent(pct)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currentAmount === parseFloat(((balanceDue * pct) / 100).toFixed(2))
                      ? "bg-amber-400 text-stone-950"
                      : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Method</label>
              <select
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-3 text-stone-100 text-sm outline-none focus:border-amber-400 transition-colors"
                {...register("method")}
              >
                {["UPI", "BANK_TRANSFER", "CASH", "CARD", "OTHER"].map((m) => (
                  <option key={m} value={m}>{m.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Date</label>
              <input
                type="date"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-3 text-stone-100 text-sm outline-none focus:border-amber-400 transition-colors"
                {...register("paymentDate")}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
              Note <span className="text-stone-600 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. First installment"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors"
              {...register("note")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg text-sm font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg text-sm font-semibold bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 transition-colors"
            >
              {loading ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}