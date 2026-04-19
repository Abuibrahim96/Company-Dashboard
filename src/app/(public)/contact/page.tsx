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
    <div className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white px-6 py-20">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left — Info */}
        <div>
          <h1 className="text-4xl font-bold text-navy-950 dark:text-white mb-4">Get in Touch</h1>
          <p className="text-navy-600 dark:text-navy-300 text-lg leading-relaxed mb-10">
            Have a question about working with us, or ready to get started? Reach out and a member
            of our team will get back to you within one business day.
          </p>

          <ul className="space-y-6">
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-500/20 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-navy-500 dark:text-navy-400 uppercase tracking-wide mb-0.5">Email</p>
                <a
                  href="mailto:info@elitetrucklines.com"
                  className="text-navy-950 dark:text-white hover:text-accent-400 transition-colors"
                >
                  info@elitetrucklines.com
                </a>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-500/20 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-navy-500 dark:text-navy-400 uppercase tracking-wide mb-0.5">Phone</p>
                <a
                  href="tel:+15033095090"
                  className="text-navy-950 dark:text-white hover:text-accent-400 transition-colors"
                >
                  (503) 309-5090
                </a>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-navy-500 dark:text-navy-400 uppercase tracking-wide mb-0.5">MC / DOT</p>
                <p className="text-navy-950 dark:text-white">MC-1476965 / DOT-3960676</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Right — Form */}
        <div className="bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 rounded-xl p-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent-50 dark:bg-accent-500/20 flex items-center justify-center">
                <Mail className="w-7 h-7 text-accent-400" />
              </div>
              <h2 className="text-2xl font-semibold text-navy-950 dark:text-white">Message Sent</h2>
              <p className="text-navy-600 dark:text-navy-300">
                Thanks for reaching out! We'll get back to you within one business day.
              </p>
              <Button
                variant="secondary"
                onClick={() => setSubmitted(false)}
                className="mt-4"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <h2 className="text-xl font-semibold text-navy-950 dark:text-white mb-1">Send Us a Message</h2>

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

              <div className="flex flex-col gap-1">
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
                  placeholder="Tell us a bit about yourself and how we can help..."
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="rounded-lg border border-navy-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-950 dark:text-white px-3 py-2 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
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
