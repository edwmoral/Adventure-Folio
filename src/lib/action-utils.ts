import type { Action, MonsterAction, Spell } from './types';

export type RangeInfo = {
  type: 'self' | 'touch' | 'ranged';
  value: number; // in feet
};

export function parseRangeFromAction(action: Action | MonsterAction | Spell): RangeInfo | null {
    // Spells have a dedicated range property, which is more reliable.
    if ('level' in action) {
        const rangeText = action.range.toLowerCase();
        if (rangeText.includes('self')) return { type: 'self', value: 0 };
        if (rangeText.includes('touch')) return { type: 'touch', value: 5 };
        const match = rangeText.match(/(\d+)/); // Find the first number
        if (match) return { type: 'ranged', value: parseInt(match[1]) };
    }

    // For Actions and MonsterActions, parse the description/effects text.
    const text = ('description' in action ? `${action.description} ${action.effects || ''}` : action.text).toLowerCase();
  
    if (text.includes('self')) return { type: 'self', value: 0 };
    if (text.includes('touch')) return { type: 'touch', value: 5 };
  
    // Look for more specific range definitions first
    let match = text.match(/range\s+(\d+)\/(\d+)\s*f(t|oo|ee)?t?/); // e.g., range 80/320 ft
    if (match) return { type: 'ranged', value: parseInt(match[1]) };
  
    match = text.match(/range\s+of\s+(\d+)\s*f(t|oo|ee)?t?/); // e.g., range of 60 feet
    if (match) return { type: 'ranged', value: parseInt(match[1]) };
  
    match = text.match(/(\d+)\s*-foot\s+range/); // e.g., 30-foot range
    if (match) return { type: 'ranged', value: parseInt(match[1]) };
    
    match = text.match(/(\d+)\s*-foot-radius/); // e.g., 20-foot-radius sphere
    if (match) return { type: 'ranged', value: parseInt(match[1]) };

    match = text.match(/(\d+)\s*f(t|oo|ee)?t\s+radius/); // e.g., 10 ft radius
    if (match) return { type: 'ranged', value: parseInt(match[1]) };
    
    match = text.match(/reach\s+(\d+)\s*f(t|oo|ee)?t?/); // e.g., reach 5 ft
    if (match) return { type: 'touch', value: parseInt(match[1]) };
    
    // Generic match for a number followed by 'ft' or 'feet'
    match = text.match(/(\d+)\s*f(t|oo|ee)?t?/);
    if (match) return { type: 'ranged', value: parseInt(match[1]) };
  
    // For melee attacks without explicit range, assume 5ft.
    if (text.includes('melee')) return { type: 'touch', value: 5 };
  
    return null;
}