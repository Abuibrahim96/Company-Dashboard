import { Target, Users, TrendingUp } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Driver-First Approach',
    description:
      'Every decision we make starts with a simple question: does this make life better for our drivers? From load selection to pay structure, drivers come first.',
  },
  {
    icon: Users,
    title: 'Real Partnership',
    description:
      "We're not just a dispatch service — we're your business partner. We invest in your success because when you win, we win.",
  },
  {
    icon: TrendingUp,
    title: 'Transparency',
    description:
      'No hidden fees, no surprise deductions. We believe in open books and honest communication at every step of our relationship.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white">
      {/* Header */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-navy-950 dark:text-white mb-6">About Elite Truck Lines</h1>
        <p className="text-navy-600 dark:text-navy-300 text-lg leading-relaxed mb-4">
          Elite Truck Lines was founded on a simple belief: truckers deserve better. Too many
          carriers treat drivers as interchangeable assets — we see them as the backbone of our
          business. We built Elite Truck Lines from the ground up to serve owner-operators and
          company drivers who are tired of being left in the dark.
        </p>
        <p className="text-navy-600 dark:text-navy-300 text-lg leading-relaxed">
          Since our founding, we have grown by putting miles on the board for drivers who want
          steady freight, fair pay, and a team they can actually call. We handle the back-office
          complexity so you can focus on what you do best — moving freight safely and efficiently
          across the country.
        </p>
      </section>

      {/* Values */}
      <section className="border-y border-navy-200 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/30 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-navy-950 dark:text-white text-center mb-12">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-50 dark:bg-accent-500/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent-400" />
                </div>
                <h3 className="text-lg font-semibold text-navy-950 dark:text-white">{title}</h3>
                <p className="text-navy-600 dark:text-navy-300 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-navy-950 dark:text-white text-center mb-12">Meet the Team</h2>
        <div className="flex justify-center">
          <div className="bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 rounded-xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-accent-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
            <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-1">Hassan</h3>
            <p className="text-accent-400 text-sm font-medium mb-3">Founder</p>
            <p className="text-navy-600 dark:text-navy-300 text-sm leading-relaxed">
              Hassan started Elite Truck Lines after seeing firsthand how difficult it was for
              owner-operators to navigate dispatch, compliance, and back-office work on their own.
              His mission is to give every driver the support system they deserve.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
