

// --- Base & Container Types ---

export type CircleShape = {
  id: string;
  type: 'circle';
  center: { x: number; y: number };
  radius: number; // in percentage of map width
  color: string;
};

export type ConeShape = {
    id: string;
    type: 'cone';
    origin: { x: number; y: number };
    endPoint: { x: number; y: number }; // Defines direction and length
    color: string;
};

export type LineShape = {
    id: string;
    type: 'line';
    start: { x: number; y: number };
    end: { x: number; y: number };
    color: string;
};

export type SquareShape = {
    id: string;
    type: 'square';
    start: { x: number; y: number };
    end: { x: number; y: number };
    color: string;
};

export type Shape = CircleShape | ConeShape | LineShape | SquareShape;

export type Token = {
  id: string;
  imageUrl: string;
  name: string;
  type: "character" | "monster" | "npc";
  position: { x: number; y: number };
  linked_character_id?: string;
  linked_enemy_id?: string;
  hp?: number;
  maxHp?: number;
  mp?: number;
  maxMp?: number;
  statusEffects?: ('dodging' | 'disengaged' | 'hidden' | 'helping')[];
  color?: string; // Player-chosen token color
};

export type Scene = {
  id: string;
  name: string;
  background_map_url: string;
  tokens: Token[];
  is_active: boolean;
  description?: string;
  width?: number;
  height?: number;
  shapes?: Shape[];
};

export type Character = {
  id: string;
  name: string;
  avatarUrl: string;
  class?: string;
  level?: number;
  tokenImageUrl?: string;
};

export type Campaign = {
  id:string;
  name: string;
  owner_user_id?: string;
  imageUrl: string;
  characters: Character[];
  scenes: Scene[];
};

export type PlayerCharacter = {
  id: string;
  name: string;
  race: string;
  className: string;
  subclass: string;
  level: number;
  avatar: string;
  backgroundStory: string;
  gender?: string;
  armorPreference?: string[];
  colorPreference?: string;
  tokenBorderColor?: string;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  hp: number;
  maxHp: number;
  ac: number;
  mp?: number;
  maxMp?: number;
  spell_slots?: Record<string, { current: number; max: number }>;
  spells?: string[];
  inventory?: string[];
};

export type Skill = {
  name: string;
  ability: string;
  description: string;
};

export type Action = {
  name: string;
  type: string;
  action_type: string;
  description: string;
  usage: {
    type: string;
    limit?: number;
  };
  effects?: string;
};


// --- Refactored Types (New Schema) ---

export type Modifier = {
    category: string;
    value: string;
};

export type Item = {
    id: string;
    name: string;
    type?: string;
    weight?: number;
    text?: string;
    value?: string;
    roll?: string;
    ac?: number;
    strength?: string;
    stealth?: boolean;
    dmg1?: string;
    dmg2?: string;
    dmgType?: string;
    property?: string[];
    range?: string;
    magic?: boolean;
    detail?: string[];
    modifier?: Modifier[];
};

export type RaceTrait = {
    name: string;
    text: string;
    special?: string;
    modifier?: Modifier[];
};

export type Race = {
    name: string;
    size?: string;
    speed?: number;
    ability?: string;
    spellAbility?: string;
    proficiency?: string[];
    trait: RaceTrait[];
};

export type ClassFeature = {
    name: string;
    text: string;
};

export type ClassAutolevel = {
    level: number;
    feature?: ClassFeature[];
    counterValue?: number;
    counterReset?: 'long rest' | 'short rest';
    slots?: string;
};

export type Class = {
    name: string;
    subclass: string;
    hd: number;
    hit_die: string;
    numSkills?: number;
    armor?: string[];
    weapons?: string[];
    tools?: string[];
    wealth?: string;
    autolevel: ClassAutolevel[];
    slotsReset?: 'long rest' | 'short rest';
    primary_ability: string;
    saving_throws: string[];
    spellcasting_type: "none" | "prepared" | "known";
    skills: string[];
    levels: ClassAutolevel[];
};

export type Feat = {
    name: string;
    text: string;
    prerequisite?: string;
    modifier?: Modifier[];
};

export type Background = {
    name: string;
    text: string;
    proficiency?: string[];
    trait?: RaceTrait[];
};

export type Spell = {
    name: string;
    text: string;
    level: number;
    school: string;
    ritual?: boolean;
    time: string;
    range: string;
    components?: string;
    duration: string;
    classes?: string;
    aoe?: {
        shape: string;
        size: number;
    };
};

export type MonsterAction = {
    name: string;
    text: string;
    attack?: string;
};

export type Monster = {
    id: string;
    name: string;
    type: string;
    alignment: string;
    ac: string;
    hp: string;
    speed: string;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    save?: string;
    skill?: string;
    resist?: string[];
    vulnerable?: string[];
    immune?: string[];
    conditionImmune?: string[];
    senses?: string;
    passive?: number;
    languages?: string;
    cr: string;
    trait?: MonsterAction[];
    action?: MonsterAction[];
    legendary?: MonsterAction[];
    reaction?: MonsterAction[];
    spells?: string;
    slots?: string;
    environment?: string;
    description?: string;
    tokenImageUrl?: string;
};

export type Combatant = {
  tokenId: string;
  name: string;
  initiative: number;
  initiativeRoll?: number;
  dexterityModifier: number;
  avatarUrl: string;
  hasAction: boolean;
  hasBonusAction: boolean;
  hasReaction: boolean;
};
