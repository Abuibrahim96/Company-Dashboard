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
  { step: 4, title: "Start Hauling", description: "Get matched with consistent freight and hit the road under our authority." },
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
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left Side */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white sm:text-5xl">
              Drive With Us
            </h1>
            <p className="mt-6 text-lg leading-8 text-navy-600 dark:text-navy-300">
              Join Elite Truck Lines as an owner-operator and partner with a team that puts
              drivers first. We handle the back office so you can focus on what you do
              best — hauling freight and growing your business.
            </p>

            {/* Benefits */}
            <ul className="mt-10 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span className="text-navy-700 dark:text-navy-200">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* How It Works */}
            <div className="mt-12 rounded-xl border border-navy-200 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/50 p-6">
              <h2 className="mb-6 text-xl font-semibold text-navy-950 dark:text-white">How It Works</h2>
              <ol className="space-y-5">
                {howItWorksSteps.map(({ step, title, description }) => (
                  <li key={step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-white">
                      {step}
                    </div>
                    <div>
                      <p className="font-medium text-navy-950 dark:text-white">{title}</p>
                      <p className="mt-0.5 text-sm text-navy-500 dark:text-navy-400">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right Side — Application Form */}
          <div className="rounded-2xl border border-navy-200 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/50 p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-bold text-navy-950 dark:text-white">Application Submitted!</h2>
                <p className="mt-3 text-navy-600 dark:text-navy-300">
                  Thank you for applying to drive with Elite Truck Lines. Our team will
                  review your application and reach out within 1-2 business days.
                </p>
              </div>
            ) : (
              <>
                <h2 className="mb-6 text-2xl font-bold text-navy-950 dark:text-white">Apply Now</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Personal Info */}
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

                  {/* CDL Class */}
                  <Select
                    id="cdl_class"
                    name="cdl_class"
                    label="CDL Class"
                    options={cdlClassOptions}
                    value={form.cdl_class}
                    onChange={handleChange}
                  />

                  {/* Truck Info — 3-col grid */}
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

                  {/* Number of Trucks */}
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

                  {/* Notes */}
                  <div className="flex flex-col gap-1">
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
                      className="rounded-lg border border-navy-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
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
