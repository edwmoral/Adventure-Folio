

// Full Caster Spell Slot Progression by Level
// Based on D&D 5e rules.

type SpellSlotInfo = {
  [level: string]: number;
};

type LevelSlotInfo = {
  level: number;
  slots: SpellSlotInfo;
};

export const fullCasterSpellSlots: LevelSlotInfo[] = [
  { level: 1, slots: { '1': 2 } },
  { level: 2, slots: { '1': 3 } },
  { level: 3, slots: { '1': 4, '2': 2 } },
  { level: 4, slots: { '1': 4, '2': 3 } },
  { level: 5, slots: { '1': 4, '2': 3, '3': 2 } },
  { level: 6, slots: { '1': 4, '2': 3, '3': 3 } },
  { level: 7, slots: { '1': 4, '2': 3, '3': 3, '4': 1 } },
  { level: 8, slots: { '1': 4, '2': 3, '3': 3, '4': 2 } },
  { level: 9, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 1 } },
  { level: 10, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 2 } },
  { level: 11, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 2, '6': 1 } },
  { level: 12, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 2, '6': 1 } },
  { level: 13, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 2, '6': 1, '7': 1 } },
  { level: 14, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 2, '6': 1, '7': 1 } },
  { level: 15, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 2, '6': 1, '7': 1, '8': 1 } },
  { level: 16, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 2, '6': 1, '7': 1, '8': 1 } },
  { level: 17, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 2, '6': 1, '7': 1, '8': 1, '9': 1 } },
  { level: 18, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 3, '6': 1, '7': 1, '8': 1, '9': 1 } },
  { level: 19, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 3, '6': 2, '7': 1, '8': 1, '9': 1 } },
  { level: 20, slots: { '1': 4, '2': 3, '3': 3, '4': 3, '5': 3, '6': 2, '7': 2, '8': 1, '9': 1 } },
];


export const PREBUILT_VOICES = [
  { id: 'Algenib', name: 'Jennifer (English)' },
  { id: 'Achernar', name: 'David (English)' },
  { id: 'Mirfak', name: 'Scribe (English)' },
  { id: 'Regulus', name: 'Elder (English)' },
];
