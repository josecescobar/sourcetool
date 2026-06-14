const STEPS = [
  {
    step: 1,
    title: 'Install the Extension',
    description:
      'Add SourceTool from the Chrome Web Store. One click, no account required.',
  },
  {
    step: 2,
    title: 'Browse Products',
    description:
      'Navigate to any product on Amazon. SourceTool opens in the side panel.',
  },
  {
    step: 3,
    title: 'Analyze and Decide',
    description:
      'See profit, competition, risk, and deal score instantly.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Up and running{' '}
            <span className="gradient-text">in under a minute</span>
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Three simple steps to start analyzing products like a pro.
          </p>
        </div>

        <div className="relative flex flex-col md:flex-row items-stretch gap-8 md:gap-0">
          {/* Connecting line */}
          {/* Vertical on mobile */}
          <div className="absolute left-6 top-0 bottom-0 w-px border-l-2 border-dashed border-card-border md:hidden" />
          {/* Horizontal on desktop */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px border-t-2 border-dashed border-card-border" />

          {STEPS.map((item) => (
            <div
              key={item.step}
              className="relative flex-1 flex items-start md:flex-col md:items-center gap-5 md:gap-4 md:text-center pl-14 md:pl-0"
            >
              {/* Step circle */}
              <div className="absolute left-2 md:relative md:left-auto w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="text-text-primary font-semibold text-lg mb-1">
                  {item.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed max-w-xs">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
