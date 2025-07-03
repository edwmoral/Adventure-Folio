
import type { Action, MonsterAction } from './types';

export type RangeInfo = {
  type: 'self' | 'touch' | 'ranged';
  value: number; // in feet
};

export function parseRangeFromAction(action: Action | MonsterAction): RangeInfo | null {
  const text = ('description' in action ? `${action.description} ${action.effects || ''}` : action.text).toLowerCase();

  if (text.includes('self')) return { type: 'self', value: 0 };
  if (text.includes('touch')) return { type: 'touch', value: 5 };

  let match = text.match(/reach\s+(\d+)\s*f(t|oo|ee)?t?/);
  if (match) return { type: 'touch', value: parseInt(match[1]) };

  match = text.match(/range\s+(\d+)\/(\d+)\s*f(t|oo|ee)?t?/);
  if (match) return { type: 'ranged', value: parseInt(match[1]) };

  match = text.match(/(\d+)\s*-foot\s+range/);
  if (match) return { type: 'ranged', value: parseInt(match[1]) };

  match = text.match(/range\s+of\s+(\d+)\s*f(t|oo|ee)?t?/);
  if (match) return { type: 'ranged', value: parseInt(match[1]) };

  match = text.match(/range\s+(\d+)\s*f(t|oo|ee)?t?/);
  if (match) return { type: 'ranged', value: parseInt(match[1]) };
  
  match = text.match(/(\d+)-foot-radius/);
  if (match) return { type: 'ranged', value: parseInt(match[1]) };

  match = text.match(/(\d+)\s*f(t|oo|ee)?t\s+radius/);
  if (match) return { type: 'ranged', value: parseInt(match[1]) };

  // For melee attacks without explicit range
  if (text.includes('melee')) return { type: 'touch', value: 5 };

  return null;
}
