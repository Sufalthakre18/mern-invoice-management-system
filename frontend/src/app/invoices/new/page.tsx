"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import api from "@/lib/api";

interface LineItemForm {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CreateInvoiceForm {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  currency: string;
  notes: string;
  lineItems: LineItemForm[];
}

const SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };

const today = new Date().toISOString().split("T")[0];
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<CreateInvoiceForm>({
    defaultValues: {
      issueDate: today,
      dueDate: nextMonth,
      taxRate: 0,
      currency: "INR",
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });

  const watchedItems = watch("lineItems");
  const watchedTax = watch("taxRate");
  const watchedCurrency = watch("currency");
  const sym = SYM[watchedCurrency] || watchedCurrency;

  const subtotal = (watchedItems || []).reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const u = Number(item.unitPrice) || 0;
    return sum + q * u;
  }, 0);

  const taxAmount = parseFloat(((subtotal * (Number(watchedTax) || 0)) / 100).toFixed(2));
  const total = subtotal + taxAmount;

  const onSubmit = async (data: CreateInvoiceForm) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/invoices", {
        invoiceNumber: data.invoiceNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail || undefined,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        taxRate: Number(data.taxRate) || 0,
        currency: data.currency,
        notes: data.notes || undefined,
        lineItems: data.lineItems.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
      });
      router.push(`/invoices/${res.data.invoice._id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 pb-20">

      {/* Header */}
      <header className="border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/invoices" className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 text-sm transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Invoices
            </Link>
            <span className="text-stone-700">/</span>
            <span className="text-sm text-stone-400">New Invoice</span>
          </div>
          <button
            form="invoice-form"
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="font-serif italic text-4xl text-stone-100">New Invoice</h1>
          <p className="text-stone-500 text-sm mt-1">Fill in the details below to create a new invoice.</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-400 text-sm animate-fade-up">
            {error}
          </div>
        )}

        <form id="invoice-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT (main form) ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Invoice Info */}
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 animate-fade-up delay-75">
                <h2 className="text-sm font-semibold text-stone-200 mb-5">Invoice Details</h2>
                <div className="grid grid-cols-2 gap-4">

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                      Invoice Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="INV-0001"
                      className={`w-full bg-stone-950 border rounded-lg px-4 py-3 text-stone-100 text-sm font-mono placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors ${errors.invoiceNumber ? "border-rose-500" : "border-stone-800"}`}
                      {...register("invoiceNumber", { required: "Required" })}
                    />
                    {errors.invoiceNumber && <p className="text-rose-400 text-xs mt-1">{errors.invoiceNumber.message}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Currency</label>
                    <select
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm outline-none focus:border-amber-400 transition-colors"
                      {...register("currency")}
                    >
                      {["INR", "USD", "EUR", "GBP", "AED"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full bg-stone-950 border rounded-lg px-4 py-3 text-stone-100 text-sm placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors ${errors.customerName ? "border-rose-500" : "border-stone-800"}`}
                      {...register("customerName", { required: "Required" })}
                    />
                    {errors.customerName && <p className="text-rose-400 text-xs mt-1">{errors.customerName.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                      Customer Email <span className="text-stone-600 normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors"
                      {...register("customerEmail")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                      Issue Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm outline-none focus:border-amber-400 transition-colors"
                      {...register("issueDate", { required: "Required" })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                      Due Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm outline-none focus:border-amber-400 transition-colors"
                      {...register("dueDate", { required: "Required" })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm font-mono placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors"
                      {...register("taxRate", { min: 0, max: 100 })}
                    />
                    <p className="text-xs text-stone-600 mt-1">e.g. 18 for 18% GST</p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                      Notes <span className="text-stone-600 normal-case tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Payment terms, bank details, thank you note..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors resize-none"
                      {...register("notes")}
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden animate-fade-up delay-150">
                <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-stone-200">Line Items</h2>
                  <button
                    type="button"
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Add Item
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 px-6 py-2.5 border-b border-stone-800/60 bg-stone-950/30">
                  <div className="col-span-5 text-xs font-medium text-stone-500 uppercase tracking-wider">Description</div>
                  <div className="col-span-2 text-xs font-medium text-stone-500 uppercase tracking-wider text-center">Qty</div>
                  <div className="col-span-3 text-xs font-medium text-stone-500 uppercase tracking-wider text-right">Unit Price</div>
                  <div className="col-span-2 text-xs font-medium text-stone-500 uppercase tracking-wider text-right">Total</div>
                </div>

                {fields.map((field, index) => {
                  const qty = Number(watchedItems?.[index]?.quantity) || 0;
                  const price = Number(watchedItems?.[index]?.unitPrice) || 0;
                  const lineTotal = qty * price;

                  return (
                    <div key={field.id} className="grid grid-cols-12 gap-3 px-6 py-3 border-b border-stone-800/40 last:border-0 items-center group">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Service or product description"
                          className={`w-full bg-stone-950 border rounded-md px-3 py-2 text-stone-100 text-sm placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors ${errors.lineItems?.[index]?.description ? "border-rose-500" : "border-stone-800"}`}
                          {...register(`lineItems.${index}.description`, { required: true })}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          className="w-full bg-stone-950 border border-stone-800 rounded-md px-3 py-2 text-stone-100 text-sm font-mono text-center placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors"
                          {...register(`lineItems.${index}.quantity`, { min: 1, valueAsNumber: true })}
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-600 text-xs font-mono">{sym}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full bg-stone-950 border border-stone-800 rounded-md pl-6 pr-3 py-2 text-stone-100 text-sm font-mono text-right placeholder:text-stone-700 outline-none focus:border-amber-400 transition-colors"
                            {...register(`lineItems.${index}.unitPrice`, { min: 0, valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="font-mono text-sm text-stone-300 text-right">
                          {sym}{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="w-5 h-5 flex items-center justify-center text-stone-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add item row */}
                <div className="px-6 py-3 border-t border-stone-800/40">
                  <button
                    type="button"
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                    className="text-xs text-stone-600 hover:text-stone-400 transition-colors flex items-center gap-1.5"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Add another line item
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT (live preview) ── */}
            <div className="space-y-4">
              <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden animate-fade-up delay-150 sticky top-20">
                <div className="px-5 py-4 border-b border-stone-800">
                  <h2 className="text-sm font-semibold text-stone-200">Live Preview</h2>
                  <p className="text-xs text-stone-600 mt-0.5">Updates as you type</p>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Subtotal</span>
                    <span className="font-mono text-stone-300">
                      {sym}{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {Number(watchedTax) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Tax ({watchedTax}%)</span>
                      <span className="font-mono text-stone-300">
                        {sym}{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-stone-800 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-stone-200">Total</span>
                      <span className="font-mono text-xl font-bold text-amber-400">
                        {sym}{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 space-y-1.5">
                    {(watchedItems || []).filter(i => i.description).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-stone-600">
                        <span className="truncate max-w-[60%]">{item.description || "—"}</span>
                        <span className="font-mono">
                          {sym}{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    type="submit"
                    form="invoice-form"
                    disabled={loading}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Invoice"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}