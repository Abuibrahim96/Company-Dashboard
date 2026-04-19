const values = [
  {
    title: 'Driver-First Approach',
    description:
      'Every decision starts with a simple question: does this make life better for our drivers?',
  },
  {
    title: 'Real Partnership',
    description:
      "We invest in your success because when you win, we win.",
  },
  {
    title: 'Transparency',
    description:
      'No hidden fees, no surprise deductions. Open books and honest communication.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white">
      {/* Header */}
      <section className="px-6 py-28 sm:py-36 max-w-2xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">About Elite Truck Lines</h1>
        <p className="text-navy-500 dark:text-navy-400 text-lg leading-[1.8] mb-6">
          Elite Truck Lines was founded on a simple belief: truckers deserve better. Too many
          carriers treat drivers as interchangeable assets — we see them as the backbone of our
          business.
        </p>
        <p className="text-navy-500 dark:text-navy-400 text-lg leading-[1.8]">
          We handle the back-office complexity so you can focus on what you do best — moving
          freight safely and efficiently across the country.
        </p>
      </section>

      {/* Values */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-16">What We Stand For</h2>
          <div className="space-y-12">
            {values.map(({ title, description }) => (
              <div key={title}>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-navy-500 dark:text-navy-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-24 sm:py-32 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-16">Meet the Team</h2>
        <div className="inline-block">
          <div className="w-14 h-14 rounded-full bg-accent-500 flex items-center justify-center mx-auto mb-5">
            <span className="text-xl font-semibold text-white">H</span>
          </div>
          <h3 className="text-lg font-semibold mb-1">Hassan</h3>
          <p className="text-accent-500 text-sm font-medium mb-4">Founder</p>
          <p className="text-navy-500 dark:text-navy-400 text-sm leading-relaxed max-w-sm">
            Hassan started Elite Truck Lines after seeing firsthand how difficult it was for
            owner-operators to navigate dispatch, compliance, and back-office work on their own.
          </p>
        </div>
      </section>
    </div>
  );
}
