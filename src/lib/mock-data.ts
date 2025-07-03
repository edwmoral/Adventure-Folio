
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
    spells: ["Magic Missile", "Shield", "Fireball"],
    inventory: ['item-dagger'],
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
    spells: [],
    inventory: ['item-dagger'],
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
    spells: [],
    inventory: ['item-1'],
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
    spells: [],
    inventory: ['item-staff'],
  },
  {
    id: 'char-test-1',
    name: 'Tester T. Testington',
    race: 'Human',
    className: 'Fighter',
    subclass: 'Champion',
    level: 1,
    avatar: 'https://placehold.co/100x100.png',
    backgroundStory: 'Born to test the limits of reality.',
    stats: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 },
    hp: 12,
    maxHp: 12,
    ac: 16,
    mp: 0,
    maxMp: 0,
    spells: [],
    inventory: ['item-1'],
  },
];


export const initialMockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'The Sunless Citadel',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char1', name: 'Eldrin', class: 'Wizard', level: 5, avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char2', name: 'Lyra', class: 'Rogue', level: 5, avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char3', name: 'Borg', class: 'Fighter', level: 5, avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene1',
            name: 'The Goblin Cave',
            width: 30,
            height: 20,
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                { id: 'token-char1', name: 'Eldrin', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char1', position: { x: 20, y: 30 } },
                { id: 'token-char2', name: 'Lyra', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char2', position: { x: 25, y: 35 } },
                { id: 'token-char3', name: 'Borg', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char3', position: { x: 15, y: 25 } },
                { id: 'token-monster1', name: 'Goblin 1', imageUrl: 'https://placehold.co/48x48.png', type: 'monster', position: { x: 60, y: 40 }, linked_enemy_id: 'goblin-1', hp: 7, maxHp: 7, mp: 0, maxMp: 0 },
                { id: 'token-monster2', name: 'Goblin 2', imageUrl: 'https://placehold.co/48x48.png', type: 'monster', position: { x: 65, y: 45 }, linked_enemy_id: 'goblin-1', hp: 7, maxHp: 7, mp: 0, maxMp: 0 },
            ],
            is_active: true,
            description: 'A damp, narrow cave littered with crude goblin drawings and the bones of small animals. A rickety rope bridge spans a dark chasm.',
        }
    ]
  },
  {
    id: '2',
    name: 'Curse of Strahd',
    imageUrl: 'https://placehold.co/400x225.png',
     characters: [
      { id: 'char4', name: 'Gandalf', class: 'Wizard', level: 10, avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene2',
            name: 'Castle Ravenloft',
            width: 50,
            height: 50,
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                 { id: 'token-char4', name: 'Gandalf', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char4', position: { x: 50, y: 50 } },
            ],
            is_active: true,
            description: 'The towering spires of a gothic castle, shrouded in mist under a perpetual twilight sky. The air is cold and carries the scent of ancient dust and sorrow.',
        }
    ]
  },
  {
    id: '3',
    name: 'Lost Mine of Phandelver',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char1', name: 'Eldrin', class: 'Wizard', level: 5, avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char2', name: 'Lyra', class: 'Rogue', level: 5, avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
      { id: 'char3', name: 'Borg', class: 'Fighter', level: 5, avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene3',
            name: 'Goblin Ambush Trail',
            width: 40,
            height: 15,
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                { id: 'token-char1', name: 'Eldrin', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char1', position: { x: 30, y: 40 } },
                { id: 'token-char2', name: 'Lyra', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char2', position: { x: 35, y: 45 } },
                { id: 'token-char3', name: 'Borg', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char3', position: { x: 25, y: 35 } },
            ],
            is_active: true,
            description: 'A well-worn trail winding through a dense forest. The path is flanked by thick bushes and large trees, perfect for an ambush. Two dead horses lie in the middle of the road.',
        }
    ]
  },
  {
    id: 'campaign-test-1',
    name: 'Testing Grounds',
    imageUrl: 'https://placehold.co/400x225.png',
    characters: [
      { id: 'char-test-1', name: 'Tester T. Testington', class: 'Fighter', level: 1, avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png' },
    ],
    scenes: [
        {
            id: 'scene-test-1',
            name: 'The Debugging Arena',
            description: 'A simple arena with a single foe.',
            width: 20,
            height: 20,
            background_map_url: 'https://placehold.co/1200x800.png',
            tokens: [
                { id: 'token-test-char', name: 'Tester T. Testington', imageUrl: 'https://placehold.co/48x48.png', type: 'character', linked_character_id: 'char-test-1', position: { x: 25, y: 50 } },
                { id: 'token-test-enemy', name: 'Bugbear', imageUrl: 'https://placehold.co/48x48.png', type: 'monster', position: { x: 75, y: 50 }, linked_enemy_id: 'bugbear-1', hp: 27, maxHp: 27, mp: 0, maxMp: 0 },
            ],
            is_active: true,
        }
    ]
  },
];
