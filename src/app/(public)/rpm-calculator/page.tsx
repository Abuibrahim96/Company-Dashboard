"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Calculator, Info } from "lucide-react";
import { Input } from "@/components/ui/Input";

const FLOOR_RPM_MIN = 3;
const FLOOR_RPM_MAX = 4;
const TARGET_MARGIN = 0.2;

interface FormState {
  fuel: string;
  insurance: string;
  truck_payment: string;
  maintenance: string;
  miles: string;
  take_home: string;
}

const defaultForm: FormState = {
  fuel: "",
  insurance: "",
  truck_payment: "",
  maintenance: "",
  miles: "",
  take_home: "",
};

function toNumber(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatRPM(n: number): string {
  return `$${n.toFixed(2)}/mi`;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function RpmCalculatorPage() {
  const [form, setForm] = useState<FormState>(defaultForm);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const result = useMemo(() => {
    const fuel = toNumber(form.fuel);
    const insurance = toNumber(form.insurance);
    const truck = toNumber(form.truck_payment);
    const maintenance = toNumber(form.maintenance);
    const miles = toNumber(form.miles);
    const takeHome = toNumber(form.take_home);

    const totalWeeklyCosts = fuel + insurance + truck + maintenance;

    if (miles <= 0 || totalWeeklyCosts <= 0) return null;

    const breakEven = totalWeeklyCosts / miles;
    const target = breakEven / (1 - TARGET_MARGIN);
    const weeklyRevenueAtTarget = target * miles;
    const weeklyProfitAtTarget = weeklyRevenueAtTarget - totalWeeklyCosts;

    // Income goal RPM: rate needed to cover overhead AND hit the
    // driver's stated take-home pay. Only computed if the driver
    // filled in the optional take-home field.
    const incomeGoal =
      takeHome > 0
        ? {
            takeHome,
            requiredRevenue: totalWeeklyCosts + takeHome,
            rpm: (totalWeeklyCosts + takeHome) / miles,
          }
        : null;

    return {
      totalWeeklyCosts,
      miles,
      breakEven,
      target,
      weeklyRevenueAtTarget,
      weeklyProfitAtTarget,
      incomeGoal,
    };
  }, [form]);

  return (
    <main className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 text-accent-500 px-3 py-1 text-xs font-medium mb-6">
            <Calculator className="h-3.5 w-3.5" />
            RPM Calculator
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Know your break-even RPM.
          </h1>
          <p className="mt-6 text-lg text-navy-500 dark:text-navy-400 leading-relaxed max-w-xl mx-auto">
            Before you accept a load, know what rate per mile you actually
            need. Fill in your weekly overhead and we'll do the math.
          </p>
        </div>

        {/* Form */}
        <div className="mt-16 rounded-2xl bg-navy-50/50 dark:bg-navy-900/30 p-8 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              id="fuel"
              name="fuel"
              label="Fuel (per week)"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="1200"
              value={form.fuel}
              onChange={handleChange}
            />
            <Input
              id="insurance"
              name="insurance"
              label="Insurance (per week)"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="250"
              value={form.insurance}
              onChange={handleChange}
            />
            <Input
              id="truck_payment"
              name="truck_payment"
              label="Truck payment (per week)"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="500"
              value={form.truck_payment}
              onChange={handleChange}
            />
            <Input
              id="maintenance"
              name="maintenance"
              label="Maintenance (per week)"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="150"
              value={form.maintenance}
              onChange={handleChange}
            />
            <div className="sm:col-span-2">
              <Input
                id="miles"
                name="miles"
                label="Miles driven (per week)"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="2500"
                value={form.miles}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Optional: personal income goal */}
          <div className="mt-6 pt-6 border-t border-navy-200 dark:border-navy-800">
            <Input
              id="take_home"
              name="take_home"
              label="Desired weekly take-home pay (optional)"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="1500"
              value={form.take_home}
              onChange={handleChange}
            />
            <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
              Fill this in to also see the exact RPM you&apos;d need to hit
              your personal income goal on top of overhead. Leave blank to
              skip.
            </p>
          </div>

          <p className="mt-6 text-xs text-navy-500 dark:text-navy-400 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Numbers stay on your device — nothing is sent anywhere.
            </span>
          </p>
        </div>

        {/* Results */}
        {result ? (
          <div className="mt-10 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-navy-200 dark:border-navy-800 p-6">
                <p className="text-xs uppercase tracking-wide text-navy-500 dark:text-navy-400 mb-2">
                  Break-even RPM
                </p>
                <p className="text-3xl font-bold text-navy-950 dark:text-white">
                  {formatRPM(result.breakEven)}
                </p>
                <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
                  The minimum rate per mile to cover your weekly overhead.
                </p>
              </div>

              <div className="rounded-2xl bg-accent-500/10 border border-accent-500/40 p-6">
                <p className="text-xs uppercase tracking-wide text-accent-500 mb-2">
                  Target RPM · 20% margin
                </p>
                <p className="text-3xl font-bold text-accent-500">
                  {formatRPM(result.target)}
                </p>
                <p className="mt-2 text-sm text-navy-600 dark:text-navy-300">
                  Leaves 20% margin after overhead — a practical target for
                  sustainable operation.
                </p>
              </div>
            </div>

            {result.incomeGoal && (
              <div className="rounded-2xl bg-navy-950 dark:bg-white/5 border border-navy-950 dark:border-white/10 p-6 text-white dark:text-white">
                <p className="text-xs uppercase tracking-wide text-navy-300 dark:text-navy-400 mb-2">
                  RPM for your income goal
                </p>
                <p className="text-3xl font-bold">
                  {formatRPM(result.incomeGoal.rpm)}
                </p>
                <p className="mt-2 text-sm text-navy-300 dark:text-navy-300">
                  What you&apos;d need to charge per mile to cover overhead
                  and take home {formatMoney(result.incomeGoal.takeHome)} per
                  week at {result.miles.toLocaleString()} miles. Total weekly
                  revenue needed:{" "}
                  {formatMoney(result.incomeGoal.requiredRevenue)}.
                </p>
              </div>
            )}

            <div className="rounded-2xl bg-navy-50/50 dark:bg-navy-900/30 p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-navy-500 dark:text-navy-400">
                    Total weekly costs
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {formatMoney(result.totalWeeklyCosts)}
                  </dd>
                </div>
                <div>
                  <dt className="text-navy-500 dark:text-navy-400">
                    Weekly revenue at target RPM
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {formatMoney(result.weeklyRevenueAtTarget)}
                  </dd>
                </div>
                <div>
                  <dt className="text-navy-500 dark:text-navy-400">
                    Weekly profit at target RPM
                  </dt>
                  <dd className="mt-1 font-semibold text-accent-500">
                    {formatMoney(result.weeklyProfitAtTarget)}
                  </dd>
                </div>
              </dl>
            </div>

            {result.target < FLOOR_RPM_MAX && (
              <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/40 p-5 text-sm text-navy-700 dark:text-navy-200">
                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                  Heads up
                </p>
                <p className="mt-1 leading-relaxed">
                  Your target RPM is within or below Elite Truck Lines&apos;
                  company minimum range of{" "}
                  <strong>
                    ${FLOOR_RPM_MIN}–${FLOOR_RPM_MAX}/mi
                  </strong>
                  . No truck moves below that range regardless of the load —
                  so in practice your effective rates will sit at the floor
                  or higher.
                </p>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Link
                href="/drive-with-us"
                className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-600"
              >
                Ready to drive with us? Apply now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="text-sm text-navy-500 dark:text-navy-400 hover:text-accent-500 transition-colors"
              >
                or talk to our team →
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-10 text-center text-sm text-navy-500 dark:text-navy-400">
            Fill in your weekly overhead and miles to see your break-even and
            target rates.
          </p>
        )}

        {/* Floor note */}
        <div className="mt-16 border-t border-navy-200 dark:border-navy-800 pt-10">
          <h2 className="text-lg font-semibold mb-3">
            About Elite Truck Lines&apos; ${FLOOR_RPM_MIN}–${FLOOR_RPM_MAX}/mi minimum
          </h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 leading-relaxed">
            Regardless of what your personal break-even comes out to, our
            company minimum sits in the{" "}
            <strong>
              ${FLOOR_RPM_MIN}–${FLOOR_RPM_MAX} per mile
            </strong>{" "}
            range. No truck moves below that range. The calculator above
            helps you figure out your own number so you can decide which
            loads are worth your time above the floor.
          </p>
        </div>
      </div>
    </main>
  );
}
