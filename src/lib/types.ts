
export type Token = {
  id: string;
  imageUrl: string;
  name: string;
  type: "character" | "monster" | "npc";
  position: { x: number; y: number };
  linked_character_id?: string;
};

export type Scene = {
  id: string;
  name: string;
  background_map_url: string;
  tokens: Token[];
  is_active: boolean;
  resolution: { width: number; height: number };
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

export type Class = {
  name: string;
  subclass: string;
  hit_die: string;
  primary_ability: string;
  saving_throws: string[];
  skills: string[];
  levels: {
      level: number;
      features: string[];
    }[];
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
};

export type Skill = {
  name: string;
  ability: string;
  description: string;
};

export type Feat = {
  name: string;
  prerequisites: string[];
  description: string;
  effects: string[];
};

export type Item = {
  name: string;
  type: string;
  rarity: string;
  weight: number;
  properties: string[];
  description: string;
  damage?: string;
  damage_type?: string;
  effect?: string;
};

export type Background = {
  name: string;
  description: string;
  skill_proficiencies: string[];
  tool_proficiencies: string[];
  equipment: string[];
  features: string[];
  personality_traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
};

export type Spell = {
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  duration: string;
  components: string[];
  material?: string;
  description: string;
  classes: string[];
  damage?: {
    type: string;
    base: string;
    scaling?: string;
  };
  area_of_effect?: {
    type: string;
    size: number;
  };
  save?: {
    type: string;
    effect: string;
  };
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
