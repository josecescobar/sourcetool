export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-16 overflow-hidden">
      <div className="hero-glow" />

      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
        {/* Pill badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 bg-accent-glow border border-accent/20 rounded-full px-4 py-1.5 text-sm text-accent font-medium">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Now available on Chrome
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up animate-delay-100 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Source smarter.{' '}
          <span className="gradient-text">Sell profitably.</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up animate-delay-200 text-text-muted text-lg sm:text-xl max-w-xl leading-relaxed">
          Instant profit analysis, deal scoring, and risk alerts — right inside
          your browser while you shop on Amazon.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row gap-3 mt-2">
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient text-white font-semibold px-7 py-3 rounded-xl text-base"
          >
            Install Free on Chrome
          </a>
          <a
            href="#features"
            className="btn-outline text-text-primary font-semibold px-7 py-3 rounded-xl text-base text-center"
          >
            See Features
          </a>
        </div>

        {/* Screenshot placeholder */}
        <div className="animate-fade-in-up animate-delay-300 mt-10 w-full max-w-2xl">
          <div className="bg-card border border-card-border rounded-2xl p-12 flex items-center justify-center">
            <span className="text-text-dim text-sm">Screenshot coming soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
