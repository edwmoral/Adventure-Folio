
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
