"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "PAID" | "OVERDUE";
  total: number;
  balanceDue: number;
  currency: string;
  isArchived: boolean;
}

const SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };

type Filter = "ALL" | "DRAFT" | "PAID" | "OVERDUE";

export default function InvoicesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    api.get("/invoices").then((r) => setInvoices(r.data.invoices)).finally(() => setLoading(false));
  }, [user, router]);

  const filtered = filter === "ALL" ? invoices : invoices.filter((i) => i.status === filter);

  const stats = [
    { label: "All",     value: invoices.length,                                      key: "ALL"     as Filter },
    { label: "Draft",   value: invoices.filter((i) => i.status === "DRAFT").length,   key: "DRAFT"   as Filter },
    { label: "Paid",    value: invoices.filter((i) => i.status === "PAID").length,    key: "PAID"    as Filter },
    { label: "Overdue", value: invoices.filter((i) => i.status === "OVERDUE").length, key: "OVERDUE" as Filter },
  ];

  const totalOutstanding = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + i.balanceDue, 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">

      {/* Top nav */}
      <header className="border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-amber-400 rounded-sm" />
            <span className="font-semibold text-stone-200 text-sm tracking-tight">Ledger</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-stone-500 text-xs hidden sm:block">{user?.name}</span>
            <button
              onClick={logout}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-md"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Page heading */}
        <div className="flex items-end justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="font-serif italic text-4xl text-stone-100">Invoices</h1>
            <p className="text-stone-500 text-sm mt-1">
              {invoices.length} total &middot; outstanding{" "}
              <span className="font-mono text-stone-300">
                ₹{totalOutstanding.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </p>
          </div>
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-sm font-semibold rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            New Invoice
          </Link>
        </div>

        {/* Stat tabs */}
        <div className="flex gap-2 mb-6 animate-fade-up delay-75 overflow-x-auto pb-1">
          {stats.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === s.key
                  ? "bg-amber-400 text-stone-950"
                  : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
              }`}
            >
              {s.label}
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${filter === s.key ? "bg-stone-950/20" : "bg-stone-800 text-stone-500"}`}>
                {s.value}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-5 h-5 border border-stone-700 border-t-amber-400 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-stone-900/40 border border-stone-800 rounded-xl">
            <p className="text-stone-400 mb-3">No invoices found</p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-sm font-semibold rounded-lg transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden animate-fade-up delay-150">
            {/* Table header */}
            <div className="grid grid-cols-12 px-5 py-3 border-b border-stone-800 bg-stone-950/40">
              {["Invoice #", "Customer", "Due Date", "Total", "Balance", "Status"].map((h, i) => (
                <div key={h} className={`text-xs font-medium text-stone-500 uppercase tracking-wider ${
                  i === 0 ? "col-span-2" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : i === 4 ? "col-span-2" : "col-span-1"
                }`}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((inv, idx) => (
              <Link
                key={inv._id}
                href={`/invoices/${inv._id}`}
                className="grid grid-cols-12 px-5 py-4 border-b border-stone-800/50 last:border-0 hover:bg-stone-800/40 transition-colors items-center group animate-fade-up"
                style={{ animationDelay: `${150 + idx * 40}ms` }}
              >
                <div className="col-span-2">
                  <span className="font-mono text-xs text-stone-300 group-hover:text-amber-400 transition-colors">
                    {inv.invoiceNumber}
                  </span>
                  {inv.isArchived && (
                    <span className="ml-1.5 text-xs text-stone-600">[archived]</span>
                  )}
                </div>
                <div className="col-span-3 text-sm text-stone-300 truncate">{inv.customerName}</div>
                <div className="col-span-2 text-xs font-mono text-stone-500">
                  {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                </div>
                <div className="col-span-2 font-mono text-sm text-stone-300">
                  {SYM[inv.currency]}{inv.total.toLocaleString("en-IN")}
                </div>
                <div className={`col-span-2 font-mono text-sm font-medium ${inv.balanceDue === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {SYM[inv.currency]}{inv.balanceDue.toLocaleString("en-IN")}
                </div>
                <div className="col-span-1">
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}