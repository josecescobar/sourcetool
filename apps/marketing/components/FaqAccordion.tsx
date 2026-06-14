'use client';

import { useState } from 'react';

export function FaqAccordion({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-card-border rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-text-primary text-sm font-medium">{question}</span>
        <span
          className={`text-text-dim text-lg shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-text-muted text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
