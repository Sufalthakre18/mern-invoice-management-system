"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface RegisterForm { name: string; email: string; password: string; }

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError("");
    try {
      await registerUser(data.name, data.email, data.password);
      router.push("/invoices");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-6 h-6 bg-amber-400 rounded-sm" />
          <span className="font-semibold text-stone-200">Ledger</span>
        </div>

        <h1 className="font-serif italic text-3xl text-stone-100 mb-1">Create account</h1>
        <p className="text-stone-500 text-sm mb-8">Start managing your invoices today.</p>

        {error && (
          <div className="mb-5 px-4 py-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { key: "name" as const, label: "Full Name", type: "text", placeholder: "Your name", rules: { required: "Required" } },
            { key: "email" as const, label: "Email", type: "email", placeholder: "you@example.com", rules: { required: "Required" } },
            { key: "password" as const, label: "Password", type: "password", placeholder: "Min 6 characters", rules: { required: "Required", minLength: { value: 6, message: "Min 6 characters" } } },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                {field.label}
              </label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                className={`w-full bg-stone-900 border rounded-lg px-4 py-3 text-stone-100 text-sm placeholder:text-stone-600 outline-none focus:border-amber-400 transition-colors ${errors[field.key] ? "border-rose-500" : "border-stone-800"}`}
                {...register(field.key, field.rules)}
              />
              {errors[field.key] && <p className="text-rose-400 text-xs mt-1">{errors[field.key]?.message}</p>}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 font-semibold py-3 rounded-lg text-sm transition-colors mt-2"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-stone-600 text-sm mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}