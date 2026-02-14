import type { DealScoreOutput, DealVerdict } from '@sourcetool/shared';

export interface TrafficLightColor {
  color: 'green' | 'amber' | 'red';
  label: string;
}

export function getTrafficLight(verdict: DealVerdict): TrafficLightColor {
  switch (verdict) {
    case 'STRONG_BUY':
      return { color: 'green', label: 'Strong Buy' };
    case 'BUY':
      return { color: 'green', label: 'Buy' };
    case 'HOLD':
      return { color: 'amber', label: 'Hold' };
    case 'PASS':
      return { color: 'red', label: 'Pass' };
    case 'STRONG_PASS':
      return { color: 'red', label: 'Strong Pass' };
  }
}

export function formatVerdict(output: DealScoreOutput): string {
  const { verdict, score, reasoning } = output;
  const light = getTrafficLight(verdict);

  return `[${light.label.toUpperCase()}] Score: ${score}/100 — ${reasoning}`;
}

export function getVerdictEmoji(verdict: DealVerdict): string {
  switch (verdict) {
    case 'STRONG_BUY': return '🟢';
    case 'BUY': return '🟢';
    case 'HOLD': return '🟡';
    case 'PASS': return '🔴';
    case 'STRONG_PASS': return '🔴';
  }
}
