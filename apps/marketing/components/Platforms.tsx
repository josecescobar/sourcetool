const PLATFORMS = [
  {
    name: 'Chrome',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <line x1="3.5" y1="17" x2="8.5" y2="14" stroke="currentColor" strokeWidth="1.5" />
        <line x1="20.5" y1="17" x2="15.5" y2="14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    available: true,
    cta: 'Install Now',
  },
  {
    name: 'iOS',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10" y1="19" x2="14" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    available: false,
    cta: 'Coming Soon',
  },
  {
    name: 'Android',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <rect x="5" y="6" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9" y1="3" x2="7" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="15" y1="3" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9.5" cy="11" r="1" fill="currentColor" />
        <circle cx="14.5" cy="11" r="1" fill="currentColor" />
      </svg>
    ),
    available: false,
    cta: 'Coming Soon',
  },
];

export function Platforms() {
  return (
    <section id="platforms" className="py-20 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Available{' '}
            <span className="gradient-text">where you source</span>
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Start with Chrome today. More platforms on the way.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.name}
              className={`bg-card border rounded-xl p-8 text-center flex flex-col items-center gap-4 ${
                platform.available
                  ? 'border-accent'
                  : 'border-card-border opacity-50'
              }`}
            >
              <div
                className={`${
                  platform.available ? 'text-accent' : 'text-text-dim'
                }`}
              >
                {platform.icon}
              </div>
              <h3 className="text-text-primary font-semibold text-lg">
                {platform.name}
              </h3>
              {platform.available ? (
                <a
                  href="https://chrome.google.com/webstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gradient text-white text-sm font-semibold px-6 py-2 rounded-lg"
                >
                  {platform.cta}
                </a>
              ) : (
                <span className="text-text-dim text-sm font-medium px-6 py-2">
                  {platform.cta}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
