import type { PlayerCharacter, Campaign } from './types';

export const initialPlayerCharacters: PlayerCharacter[] = [
  {
    id: 'char1',
    name: 'Eldrin',
    race: 'Elf',
    className: 'Wizard',
    subclass: 'School of Evocation',
    level: 5,
    avatar: 'https://placehold.co/100x100.png',
    backgroundStory: 'A studious elf wizard seeking lost knowledge.',
    stats: { str: 8, dex: 14, con: 12, int: 18, wis: 15, cha: 10 },
    hp: 27,
    maxHp: 27,
    ac: 12,
    mp: 50,
    maxMp: 50,
    spell_slots: {
      '1': { current: 4, max: 4 },
      '2': { current: 3, max: 3 },
      '3': { current: 2, max: 2 },
    },
  },
  {
    id: 'char2',
    name: 'Lyra',
    race: 'Human',
    className: 'Rogue',
    subclass: 'Thief',
    level: 5,
    avatar: 'https://placehold.co/100x100.png',
    backgroundStory: 'A nimble rogue with a heart of gold, escaping a troubled past.',
    stats: { str: 10, dex: 18, con: 14, int: 12, wis: 10, cha: 16 },
    hp: 38,
    maxHp: 38,
    ac: 16,
    mp: 0,
    maxMp: 0,
  },
  {
    id: 'char3',
    name: 'Borg',
    race: 'Dwarf',
    className: 'Fighter',
    subclass: 'Champion',
    level: 5,
    avatar: 'https://placehold.co/100x100.png',
    backgroundStory: 'A stoic dwarven warrior, fiercely loyal to his friends.',
    stats: { str: 18, dex: 12, con: 16, int: 10, wis: 14, cha: 8 },
    hp: 52,
    maxHp: 52,
    ac: 18,
    mp: 0,
    maxMp: 0,
  },
  {
    id: 'char4',
    name: 'Gandalf',
    race: 'Human',
    className: 'Wizard',
    subclass: 'School of Illusion',
    level: 10,
    avatar: 'https://placehold.co/100x100.png',
    backgroundStory: 'A wise old wizard.',
    stats: { str: 10, dex: 10, con: 10, int: 20, wis: 18, cha: 16 },
    hp: 50,
    maxHp: 50,
    ac: 12,
    mp: 100,
    maxMp: 100,
    spell_slots: {
      '1': { current: 4, max: 4 },
      '2': { current: 3, max: 3 },
      '3': { current: 3, max: 3 },
      '4': { current: 3, max: 3 },
      '5': { current: 2, max: 2 },
    },
  },
];


export const initialMockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'The Sunless Citadel',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char1', name: 'Eldrin', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char2', name: 'Lyra', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char3', name: 'Borg', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene1',
            name: 'The Goblin Cave',
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                { id: 'token-char1', name: 'Eldrin', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char1', position: { x: 20, y: 30 } },
                { id: 'token-char2', name: 'Lyra', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char2', position: { x: 25, y: 35 } },
                { id: 'token-char3', name: 'Borg', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char3', position: { x: 15, y: 25 } },
                { id: 'token-monster1', name: 'Goblin 1', imageUrl: 'https://placehold.co/48x48.png', type: 'monster', position: { x: 60, y: 40 }, linked_enemy_id: 'goblin-1', hp: 7, maxHp: 7, mp: 0, maxMp: 0 },
                { id: 'token-monster2', name: 'Goblin 2', imageUrl: 'https://placehold.co/48x48.png', type: 'monster', position: { x: 65, y: 45 }, linked_enemy_id: 'goblin-1', hp: 7, maxHp: 7, mp: 0, maxMp: 0 },
            ],
            is_active: true,
        }
    ]
  },
  {
    id: '2',
    name: 'Curse of Strahd',
    imageUrl: 'https://placehold.co/400x225.png',
     characters: [
      { id: 'char4', name: 'Gandalf', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene2',
            name: 'Castle Ravenloft',
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                 { id: 'token-char4', name: 'Gandalf', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char4', position: { x: 50, y: 50 } },
            ],
            is_active: true,
        }
    ]
  },
  {
    id: '3',
    name: 'Lost Mine of Phandelver',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char1', name: 'Eldrin', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char2', name: 'Lyra', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char3', name: 'Borg', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene3',
            name: 'Goblin Ambush Trail',
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                { id: 'token-char1', name: 'Eldrin', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char1', position: { x: 30, y: 40 } },
                { id: 'token-char2', name: 'Lyra', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char2', position: { x: 35, y: 45 } },
                { id: 'token-char3', name: 'Borg', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char3', position: { x: 25, y: 35 } },
            ],
            is_active: true,
        }
    ]
  },
];
