"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import PaymentModal from "@/components/PaymentModal";
import CurrencyConverter from "@/components/CurrencyConverter";

interface LineItem  { _id: string; description: string; quantity: number; unitPrice: number; lineTotal: number; }
interface Payment   { _id: string; amount: number; paymentDate: string; method: string; note?: string; }
interface Invoice   {
  _id: string; invoiceNumber: string; customerName: string; customerEmail?: string;
  issueDate: string; dueDate: string; status: "DRAFT" | "PAID" | "OVERDUE";
  taxRate: number; taxAmount: number; subtotal: number; total: number;
  amountPaid: number; balanceDue: number; currency: string; notes?: string;
  isArchived: boolean; isOverdue: boolean;
}

const SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };

const money = (n: number, c: string) =>
  `${SYM[c] || c}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const shortDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [invoice,    setInvoice]    = useState<Invoice | null>(null);
  const [lineItems,  setLineItems]  = useState<LineItem[]>([]);
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [archiving,  setArchiving]  = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    fetchInvoice();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchInvoice = async () => {
    try {
      const r = await api.get(`/invoices/${id}`);
      setInvoice(r.data.invoice);
      setLineItems(r.data.lineItems);
      setPayments(r.data.payments);
    } catch {
      router.replace("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleArchive = async () => {
    if (!invoice) return;
    setArchiving(true);
    try {
      await api.post(invoice.isArchived ? "/invoices/restore" : "/invoices/archive", { id: invoice._id });
      await fetchInvoice();
      showToast(invoice.isArchived ? "Invoice restored" : "Invoice archived");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || "Failed", false);
    } finally {
      setArchiving(false);
    }
  };

  const handlePDF = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      const r = await api.get(`/invoices/${invoice._id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${invoice.invoiceNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      showToast("PDF downloaded");
    } catch {
      showToast("PDF failed", false);
    } finally {
      setPdfLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="w-5 h-5 border border-stone-700 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );

  if (!invoice) return null;

  const pct = invoice.total > 0 ? Math.min((invoice.amountPaid / invoice.total) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 pb-20">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl animate-scale-in ${toast.ok ? "bg-emerald-950 border border-emerald-800 text-emerald-300" : "bg-rose-950 border border-rose-800 text-rose-300"}`}>
          {toast.msg}
        </div>
      )}

      {/* Sticky header */}
      <header className="border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/invoices" className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 text-sm transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Invoices
            </Link>
            <span className="text-stone-700">/</span>
            <span className="font-mono text-xs text-stone-400">{invoice.invoiceNumber}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePDF}
              disabled={pdfLoading}
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 rounded-md transition-colors disabled:opacity-40"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {pdfLoading ? "..." : "PDF"}
            </button>

            <button
              onClick={handleArchive}
              disabled={archiving}
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 rounded-md transition-colors disabled:opacity-40"
            >
              {archiving ? "..." : invoice.isArchived ? "Restore" : "Archive"}
            </button>

            {invoice.balanceDue > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-md transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Add Payment
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* ── HERO HEADER ─────────────────────────────────── */}
        <div className="animate-fade-up mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="font-mono text-2xl font-medium text-stone-100">{invoice.invoiceNumber}</h1>
                <StatusBadge status={invoice.status} />
                {invoice.isArchived && (
                  <span className="text-xs px-2 py-0.5 bg-stone-800 text-stone-500 rounded">archived</span>
                )}
              </div>
              <p className="font-serif italic text-3xl text-stone-100 mb-1">{invoice.customerName}</p>
              {invoice.customerEmail && (
                <p className="text-stone-500 text-sm">{invoice.customerEmail}</p>
              )}
            </div>

            {/* Amount at a glance */}
            <div className="sm:text-right">
              <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Balance Due</p>
              <p className={`font-mono text-3xl font-medium ${invoice.balanceDue === 0 ? "text-emerald-400" : invoice.isOverdue ? "text-rose-400" : "text-stone-100"}`}>
                {money(invoice.balanceDue, invoice.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* ── META STRIP ──────────────────────────────────── */}
        <div className="flex flex-wrap gap-6 mb-8 p-4 bg-stone-900/60 border border-stone-800 rounded-xl animate-fade-up delay-75">
          {[
            { label: "Issue Date", value: shortDate(invoice.issueDate), mono: false },
            { label: "Due Date",   value: shortDate(invoice.dueDate),   mono: false, warn: invoice.isOverdue },
            { label: "Currency",   value: invoice.currency,             mono: true  },
            { label: "Tax Rate",   value: invoice.taxRate ? `${invoice.taxRate}%` : "None", mono: true },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`text-sm font-medium ${m.warn ? "text-rose-400" : "text-stone-200"} ${m.mono ? "font-mono" : ""}`}>
                {m.value}
                {m.warn && <span className="ml-1.5 text-xs text-rose-500">overdue</span>}
              </p>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Line items + Payments ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Line items */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden animate-fade-up delay-150">
              <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-200">Line Items</h2>
                <span className="font-mono text-xs text-stone-600">{lineItems.length} item{lineItems.length !== 1 && "s"}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-800/60 bg-stone-950/30">
                      <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, i) => (
                      <tr
                        key={item._id}
                        className="border-b border-stone-800/40 last:border-0 hover:bg-stone-800/20 transition-colors animate-fade-up"
                        style={{ animationDelay: `${200 + i * 50}ms` }}
                      >
                        <td className="px-5 py-3.5 text-sm text-stone-200">{item.description}</td>
                        <td className="px-4 py-3.5 text-center font-mono text-sm text-stone-400">{item.quantity}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-sm text-stone-400">{money(item.unitPrice, invoice.currency)}</td>
                        <td className="px-5 py-3.5 text-right font-mono text-sm font-medium text-stone-200">{money(item.lineTotal, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden animate-fade-up delay-225">
              <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-200">Payment History</h2>
                {invoice.balanceDue > 0 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Add
                  </button>
                )}
              </div>

              {payments.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-stone-600 text-sm">No payments recorded</p>
                </div>
              ) : (
                <div>
                  {payments.map((p, i) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between px-5 py-4 border-b border-stone-800/40 last:border-0 hover:bg-stone-800/20 transition-colors animate-fade-up"
                      style={{ animationDelay: `${225 + i * 60}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-900/60 flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-stone-200 font-medium">
                            {p.method?.replace("_", " ") || "Payment"}
                          </p>
                          <p className="text-xs font-mono text-stone-500 mt-0.5">
                            {shortDate(p.paymentDate)}
                            {p.note && <span className="ml-1.5 text-stone-600">— {p.note}</span>}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-emerald-400">
                        +{money(p.amount, invoice.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Totals + Actions ── */}
          <div className="space-y-4">

            {/* Summary card */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden animate-fade-up delay-150">
              <div className="px-5 py-4 border-b border-stone-800">
                <h2 className="text-sm font-semibold text-stone-200">Summary</h2>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-mono text-stone-300">{money(invoice.subtotal || invoice.total, invoice.currency)}</span>
                </div>

                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">GST ({invoice.taxRate}%)</span>
                    <span className="font-mono text-stone-300">{money(invoice.taxAmount || 0, invoice.currency)}</span>
                  </div>
                )}

                <div className="border-t border-stone-800 pt-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-stone-200">Total</span>
                    <span className="font-mono text-stone-100">{money(invoice.total, invoice.currency)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Amount Paid</span>
                  <span className="font-mono font-medium text-emerald-400">{money(invoice.amountPaid, invoice.currency)}</span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full animate-bar"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "#34d399" : "#fbbf24",
                      }}
                    />
                  </div>
                  <p className="text-right text-xs font-mono text-stone-600 mt-1">{pct.toFixed(0)}% paid</p>
                </div>

                <div className="border-t border-stone-800 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-stone-200">Balance Due</span>
                    <span className={`font-mono text-xl font-bold ${invoice.balanceDue === 0 ? "text-emerald-400" : "text-stone-100"}`}>
                      {money(invoice.balanceDue, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                {invoice.balanceDue > 0 ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Record Payment
                  </button>
                ) : (
                  <div className="w-full py-2.5 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 text-sm font-medium rounded-lg text-center">
                    ✓ Fully Paid
                  </div>
                )}
              </div>
            </div>

            {/* Mobile actions */}
            <div className="flex gap-2 sm:hidden animate-fade-up delay-225">
              <button onClick={handlePDF} disabled={pdfLoading}
                className="flex-1 py-2.5 text-xs font-medium bg-stone-900 border border-stone-800 text-stone-400 rounded-lg hover:text-stone-200 transition-colors disabled:opacity-40">
                {pdfLoading ? "..." : "Download PDF"}
              </button>
              <button onClick={handleArchive} disabled={archiving}
                className="flex-1 py-2.5 text-xs font-medium bg-stone-900 border border-stone-800 text-stone-400 rounded-lg hover:text-stone-200 transition-colors disabled:opacity-40">
                {archiving ? "..." : invoice.isArchived ? "Restore" : "Archive"}
              </button>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 animate-fade-up delay-300">
                <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            {/* Currency Converter */}
            <div className="animate-fade-up delay-375">
              <CurrencyConverter
                invoiceId={invoice._id}
                currentCurrency={invoice.currency}
                total={invoice.total}
              />
            </div>

          </div>
        </div>
      </main>

      {/* Payment modal */}
      {showModal && invoice && (
        <PaymentModal
          invoiceId={invoice._id}
          balanceDue={invoice.balanceDue}
          currency={invoice.currency}
          onClose={() => setShowModal(false)}
          onSuccess={async () => { setShowModal(false); await fetchInvoice(); showToast("Payment recorded"); }}
        />
      )}
    </div>
  );
}