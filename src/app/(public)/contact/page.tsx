'use client';

import { useState, FormEvent } from 'react';
import { Mail, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const initialForm: FormState = { name: '', email: '', phone: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setForm(initialForm);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white px-6 py-24 sm:py-32">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left -- Info */}
        <div className="animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Get in Touch</h1>
          <p className="text-navy-500 dark:text-navy-400 text-lg leading-relaxed mb-12">
            Have a question or ready to get started? We will get back to you within one business day.
          </p>

          <ul className="space-y-5">
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-navy-400 dark:text-navy-500 flex-shrink-0" />
              <a
                href="mailto:info@elitetrucklines.com"
                className="text-navy-700 dark:text-navy-300 hover:text-accent-500 transition-colors text-sm"
              >
                info@elitetrucklines.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-navy-400 dark:text-navy-500 flex-shrink-0" />
              <a
                href="tel:+15033095090"
                className="text-navy-700 dark:text-navy-300 hover:text-accent-500 transition-colors text-sm"
              >
                (503) 309-5090
              </a>
            </li>
            <li className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-navy-400 dark:text-navy-500 flex-shrink-0" />
              <span className="text-navy-700 dark:text-navy-300 text-sm">MC-1476965 / DOT-3960676</span>
            </li>
          </ul>
        </div>

        {/* Right -- Form */}
        <div className="rounded-2xl bg-navy-50/50 dark:bg-navy-900/30 p-8 sm:p-10">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Mail className="w-6 h-6 text-accent-500" />
              <h2 className="text-xl font-semibold">Message Sent</h2>
              <p className="text-navy-500 dark:text-navy-400 text-sm">
                We will get back to you within one business day.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold mb-2">Send Us a Message</h2>

              <Input
                id="name"
                name="name"
                label="Full Name"
                placeholder="John Smith"
                value={form.name}
                onChange={handleChange}
                required
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />

              <Input
                id="phone"
                name="phone"
                type="tel"
                label="Phone Number"
                placeholder="(503) 309-5090"
                value={form.phone}
                onChange={handleChange}
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-navy-600 dark:text-navy-300"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell us how we can help..."
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-950 dark:text-white px-4 py-3 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 resize-none transition-shadow"
                />
              </div>

              <Button type="submit" size="lg" className="mt-2 w-full">
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
