import Link from 'next/link';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center rounded-lg text-white font-extrabold"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.45,
          background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
        }}
      >
        S
      </div>
      <span className="text-text-primary font-bold text-lg tracking-tight">
        SourceTool
      </span>
    </Link>
  );
}
