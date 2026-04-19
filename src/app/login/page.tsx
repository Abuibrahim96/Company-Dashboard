"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-2xl p-8 shadow-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold tracking-widest text-navy-950 dark:text-white uppercase">
                Elite Truck Lines
              </span>
            </Link>
            <p className="mt-2 text-navy-600 dark:text-navy-300 text-sm">
              Sign in to your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-navy-500 dark:text-navy-400 hover:text-navy-950 dark:hover:text-white transition-colors"
          >
            &larr; Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
