"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) router.replace(user ? "/invoices" : "/login");
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="w-5 h-5 border border-stone-600 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );
}