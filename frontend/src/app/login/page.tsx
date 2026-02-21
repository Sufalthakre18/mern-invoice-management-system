"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface LoginForm { email: string; password: string; }

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");
    try {
      await login(data.email, data.password);
      router.push("/invoices");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-stone-900 border-r border-stone-800 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-400 rounded-sm" />
          <span className="font-semibold text-stone-200 tracking-tight">Ledger</span>
        </div>
        <div>
          <p className="font-serif italic text-5xl text-stone-100 leading-tight mb-6">
            Every invoice.<br />Every payment.<br />Tracked.
          </p>
          <p className="text-stone-500 text-sm leading-relaxed max-w-xs">
            Built for freelancers and small teams who need clarity, not complexity.
          </p>
        </div>
        <div className="flex gap-6">
          {["Draft", "Paid", "Overdue"].map((s, i) => (
            <div key={s}>
              <div className={`text-xs font-medium mb-1 ${i === 0 ? "text-amber-400" : i === 1 ? "text-emerald-400" : "text-rose-400"}`}>{s}</div>
              <div className="text-stone-400 text-xs font-mono">{["DRAFT", "✓ PAID", "! DUE"][i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
        
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-6 h-6 bg-amber-400 rounded-sm" />
            <span className="font-semibold text-stone-200">Ledger</span>
          </div>

          <h1 className="font-serif italic text-3xl text-stone-100 mb-1">Sign in</h1>
          <p className="text-stone-500 text-sm mb-8">Welcome back. Enter your details below.</p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full bg-stone-900 border rounded-lg px-4 py-3 text-stone-100 text-sm placeholder:text-stone-600 outline-none focus:border-amber-400 transition-colors ${errors.email ? "border-rose-500" : "border-stone-800"}`}
                {...register("email", { required: "Required" })}
              />
              {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full bg-stone-900 border rounded-lg px-4 py-3 text-stone-100 text-sm placeholder:text-stone-600 outline-none focus:border-amber-400 transition-colors ${errors.password ? "border-rose-500" : "border-stone-800"}`}
                {...register("password", { required: "Required" })}
              />
              {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 font-semibold py-3 rounded-lg text-sm transition-colors mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-stone-600 text-sm mt-6 text-center">
            No account?{" "}
            <Link href="/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              Register here
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-stone-900 border border-stone-800 rounded-lg">
            <p className="text-xs text-stone-500 font-medium uppercase tracking-wider mb-2">Demo credentials</p>
            <p className="font-mono text-xs text-stone-400">demo@example.com</p>
            <p className="font-mono text-xs text-stone-400">password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}