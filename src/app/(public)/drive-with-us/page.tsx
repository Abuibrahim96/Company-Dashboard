"use client";

import { useState, FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const benefits = [
  "Keep 85-90% of gross revenue",
  "Consistent freight — no load board hunting",
  "Full compliance tracking and alerts",
  "Invoicing and collections handled",
  "No upfront costs or hidden fees",
  "Dedicated support for every driver",
];

const howItWorksSteps = [
  { step: 1, title: "Submit Your Application", description: "Fill out the form with your details and truck information." },
  { step: 2, title: "Review & Onboarding Call", description: "Our team reviews your application and schedules a quick intro call." },
  { step: 3, title: "Complete Compliance Setup", description: "We handle the paperwork, DOT compliance, and get you carrier-ready." },
  { step: 4, title: "Start Hauling", description: "Get matched with consistent freight and hit the road." },
];

const cdlClassOptions = [
  { value: "", label: "Select CDL Class" },
  { value: "A", label: "Class A" },
  { value: "B", label: "Class B" },
];

interface FormState {
  full_name: string;
  phone: string;
  email: string;
  cdl_class: string;
  truck_year: string;
  truck_make: string;
  truck_model: string;
  num_trucks: string;
  notes: string;
}

const defaultForm: FormState = {
  full_name: "",
  phone: "",
  email: "",
  cdl_class: "",
  truck_year: "",
  truck_make: "",
  truck_model: "",
  num_trucks: "",
  notes: "",
};

export default function DriveWithUsPage() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid gap-20 lg:grid-cols-2 lg:gap-16">
          {/* Left Side */}
          <div className="animate-fade-in">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Drive With Us
            </h1>
            <p className="mt-6 text-lg text-navy-500 dark:text-navy-400 leading-relaxed max-w-md">
              Partner with a team that puts drivers first. We handle the back office
              so you can focus on hauling freight.
            </p>

            {/* Benefits */}
            <ul className="mt-10 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-accent-500" />
                  <span className="text-navy-600 dark:text-navy-300">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* How It Works */}
            <div className="mt-16">
              <h2 className="text-lg font-semibold mb-8">How It Works</h2>
              <ol className="space-y-6">
                {howItWorksSteps.map(({ step, title, description }) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 dark:bg-navy-800 text-xs font-semibold text-navy-600 dark:text-navy-300">
                      {step}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{title}</p>
                      <p className="mt-0.5 text-sm text-navy-500 dark:text-navy-400">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right Side — Application Form */}
          <div className="rounded-2xl bg-navy-50/50 dark:bg-navy-900/30 p-8 sm:p-10 h-fit">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                <h2 className="text-2xl font-bold">Application Submitted</h2>
                <p className="mt-3 text-navy-500 dark:text-navy-400 text-sm">
                  Our team will review your application and reach out within 1-2 business days.
                </p>
              </div>
            ) : (
              <>
                <h2 className="mb-8 text-xl font-semibold">Apply Now</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    id="full_name"
                    name="full_name"
                    label="Full Name *"
                    placeholder="John Smith"
                    required
                    value={form.full_name}
                    onChange={handleChange}
                  />
                  <Input
                    id="phone"
                    name="phone"
                    label="Phone *"
                    type="tel"
                    placeholder="(555) 000-0000"
                    required
                    value={form.phone}
                    onChange={handleChange}
                  />
                  <Input
                    id="email"
                    name="email"
                    label="Email *"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={form.email}
                    onChange={handleChange}
                  />

                  <Select
                    id="cdl_class"
                    name="cdl_class"
                    label="CDL Class"
                    options={cdlClassOptions}
                    value={form.cdl_class}
                    onChange={handleChange}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      id="truck_year"
                      name="truck_year"
                      label="Year"
                      placeholder="2020"
                      value={form.truck_year}
                      onChange={handleChange}
                    />
                    <Input
                      id="truck_make"
                      name="truck_make"
                      label="Make"
                      placeholder="Freightliner"
                      value={form.truck_make}
                      onChange={handleChange}
                    />
                    <Input
                      id="truck_model"
                      name="truck_model"
                      label="Model"
                      placeholder="Cascadia"
                      value={form.truck_model}
                      onChange={handleChange}
                    />
                  </div>

                  <Input
                    id="num_trucks"
                    name="num_trucks"
                    label="Number of Trucks"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={form.num_trucks}
                    onChange={handleChange}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="notes" className="text-sm font-medium text-navy-600 dark:text-navy-300">
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      placeholder="Anything else you'd like us to know..."
                      value={form.notes}
                      onChange={handleChange}
                      className="rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-4 py-3 text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 resize-none transition-shadow"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
