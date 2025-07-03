
'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Shield, Footprints, Users, Swords, Sparkles, BookOpen } from 'lucide-react';
import type { PlayerCharacter, Scene, Token, Class, Spell, Action as ActionType, Combatant, Item } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface PlayerCharacterSheetModuleProps {
  scene: Scene | null;
  allPlayerCharacters: PlayerCharacter[];
  allClasses: Class[];
  allSpells: Spell[];
  allItems: Item[];
  selectedTokenId: string | null;
  onTokenSelect: (id: string | null) => void;
  onActionActivate: (action: ActionType) => void;
  activeCombatant: Combatant | null;
}

const StatDisplay = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-card-foreground/5 rounded-lg text-center">
        <div className="text-xl font-semibold">{icon}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
    </div>
);

const getModifier = (score: number) => Math.floor((score - 10) / 2);
const getModifierString = (score: number) => {
    const mod = getModifier(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
};

export function PlayerCharacterSheetModule({ 
    scene, 
    allPlayerCharacters, 
    allClasses, 
    allSpells, 
    allItems, 
    selectedTokenId, 
    onTokenSelect, 
    onActionActivate, 
    activeCombatant 
}: PlayerCharacterSheetModuleProps) {
  
  const playerTokens = useMemo(() => {
    if (!scene) return [];
    return scene.tokens.filter(t => t.type === 'character');
  }, [scene]);

  const { token, character } = useMemo(() => {
    if (!selectedTokenId || !scene) return { token: null, character: null };

    const token = scene.tokens.find(t => t.id === selectedTokenId);
    if (!token || token.type !== 'character') return { token: null, character: null };

    const character = allPlayerCharacters.find(c => c.id === token.linked_character_id);
    return { token, character };
  }, [selectedTokenId, scene, allPlayerCharacters]);
  
  const { characterFeatures, knownSpells, availableActions } = useMemo(() => {
    if (!character || !allClasses.length || !allSpells.length || !allItems.length) {
        return { characterFeatures: [], knownSpells: [], availableActions: [] };
    }
    
    const characterClass = allClasses.find(
      c => c.name === character.className && c.subclass === character.subclass
    );

    const features = characterClass?.levels
      .filter(l => l.level <= character.level)
      .flatMap(l => l.feature || [])
      .map(f => ({ name: f.name, description: f.text })) || [];
      
    const spells = allSpells.filter(spell => character.spells?.includes(spell.name));
    
    // --- Dynamic Action Generation ---
    const baseActions: ActionType[] = [
        { name: 'Dash', type: 'Action', action_type: 'Standard', description: 'Double your movement speed for the turn. Range: Self.', usage: {type: 'At Will'} },
        { name: 'Disengage', type: 'Action', action_type: 'Standard', description: 'Your movement doesn\'t provoke opportunity attacks. Range: Self.', usage: {type: 'At Will'} },
        { name: 'Dodge', type: 'Action', action_type: 'Standard', description: 'Attack rolls against you have disadvantage until your next turn. Range: Self.', usage: {type: 'At Will'} },
        { name: 'Help', type: 'Action', action_type: 'Standard', description: 'Grant an ally advantage on an ability check or their next attack. Range: Touch.', usage: {type: 'At Will'} },
        { name: 'Hide', type: 'Action', action_type: 'Standard', description: 'Make a Dexterity (Stealth) check to become unseen. Range: Self.', usage: {type: 'At Will'} },
    ];
    
    const proficiencyBonus = Math.ceil(1 + (character.level || 1) / 4);
    const strMod = getModifier(character.stats.str);
    const dexMod = getModifier(character.stats.dex);
    
    const weapon = character.inventory?.map(id => allItems.find(i => i.id === id)).find(i => i?.type === 'Weapon');
    let attackAction: ActionType;

    if (weapon) {
        const isFinesse = weapon.property?.includes('Finesse');
        const abilityMod = isFinesse ? Math.max(strMod, dexMod) : strMod;
        const abilityModString = abilityMod >= 0 ? `+${abilityMod}` : `${abilityMod}`;
        
        const toHit = proficiencyBonus + abilityMod;
        const damageString = `${weapon.dmg1}${abilityModString} ${weapon.dmgType}`;
        
        attackAction = {
            name: `Attack (${weapon.name})`,
            type: 'Action',
            action_type: 'Standard',
            description: `Make a melee attack with your ${weapon.name}.`,
            effects: `To Hit: +${toHit}, Damage: ${damageString}`,
            usage: { type: 'At Will' }
        };
    } else {
        // Unarmed strike
        attackAction = {
            name: 'Unarmed Strike',
            type: 'Action',
            action_type: 'Standard',
            description: 'Make an unarmed strike.',
            effects: `To Hit: +${proficiencyBonus + strMod}, Damage: ${1 + strMod} bludgeoning`,
            usage: { type: 'At Will' }
        };
    }
    
    const allActions = [attackAction, ...baseActions];

    return { characterFeatures: features, knownSpells: spells, availableActions: allActions };

  }, [character, allClasses, allSpells, allItems]);

  const isMyTurn = activeCombatant?.tokenId === selectedTokenId;
  
  const getActionDisabledState = (actionType: string) => {
    if (!activeCombatant) return false; // Not in combat, actions are enabled
    if (!isMyTurn) return true; // Not my turn
    if (actionType === 'Action' && !activeCombatant.hasAction) return true;
    if (actionType === 'Bonus Action' && !activeCombatant.hasBonusAction) return true;
    if (actionType === 'Reaction' && !activeCombatant.hasReaction) return true;
    return false;
  };


  return (
    <div className="h-full flex flex-col">
        <div className="p-4 border-b">
            <Label>Select Character</Label>
            <Select value={selectedTokenId || ''} onValueChange={onTokenSelect}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a character..." />
                </SelectTrigger>
                <SelectContent>
                    {playerTokens.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <ScrollArea className="flex-1">
            {character && token ? (
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-4" style={{ borderColor: character.tokenBorderColor || 'hsl(var(--primary))' }}>
                            <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                            <AvatarFallback>{token.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-2xl font-bold font-headline">{token.name}</h2>
                            <p className="text-muted-foreground">
                                {character.race} {character.className}
                            </p>
                        </div>
                    </div>

                    {activeCombatant && isMyTurn && (
                        <div className="flex gap-2 p-2 bg-muted rounded-md justify-center">
                            <Badge variant={activeCombatant.hasAction ? "default" : "secondary"}>Action</Badge>
                            <Badge variant={activeCombatant.hasBonusAction ? "default" : "secondary"}>Bonus Action</Badge>
                            <Badge variant={activeCombatant.hasReaction ? "default" : "secondary"}>Reaction</Badge>
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Health</span>
                            <span>{token.hp ?? character.hp} / {token.maxHp ?? character.maxHp}</span>
                        </div>
                        <Progress value={(token.hp && token.maxHp) ? (token.hp/token.maxHp)*100 : 0} className={"[&>div]:bg-green-500"} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <StatDisplay icon={<Shield />} label="Armor Class" value={character.ac} />
                        <StatDisplay icon={<Footprints />} label="Speed" value={'30 ft.'} />
                    </div>

                    <Separator />
                    
                    <div className="grid grid-cols-3 gap-2">
                        <StatDisplay icon={<>STR</>} label="Strength" value={character.stats.str} />
                        <StatDisplay icon={<>DEX</>} label="Dexterity" value={character.stats.dex} />
                        <StatDisplay icon={<>CON</>} label="Constitution" value={character.stats.con} />
                        <StatDisplay icon={<>INT</>} label="Intelligence" value={character.stats.int} />
                        <StatDisplay icon={<>WIS</>} label="Wisdom" value={character.stats.wis} />
                        <StatDisplay icon={<>CHA</>} label="Charisma" value={character.stats.cha} />
                    </div>

                    <Separator />

                    <Accordion type="multiple" defaultValue={['actions']} className="w-full space-y-1">
                        <AccordionItem value="actions">
                            <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                                <div className="flex items-center gap-2"><Swords className="h-5 w-5" /> Actions</div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="space-y-3 pt-2 border-t text-sm">
                                    {availableActions.map((action) => (
                                        <div key={action.name}>
                                            <Button variant="link" className="p-0 h-auto text-sm text-left" disabled={getActionDisabledState(action.type)} onClick={() => onActionActivate(action)}>
                                                <h4 className="font-semibold">{action.name} <Badge variant="secondary">{action.type}</Badge></h4>
                                            </Button>
                                            <p className="text-muted-foreground mt-1">{action.effects || action.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="features">
                            <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                                <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Features</div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="space-y-3 pt-2 border-t text-sm">
                                    {characterFeatures.map((feature) => (
                                        <div key={feature.name}>
                                            <h4 className="font-semibold">{feature.name}</h4>
                                            <p className="text-muted-foreground mt-1">{feature.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="spells">
                            <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                                <div className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Spells</div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="space-y-4 pt-2 border-t">
                                    {character.spell_slots && Object.keys(character.spell_slots).length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold mb-2 text-sm">Spell Slots</h4>
                                            <div className="grid grid-cols-4 gap-2">
                                                {Object.entries(character.spell_slots)
                                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                    .map(([level, slots]) => (
                                                    <div key={level} className="flex flex-col items-center justify-center p-2 bg-card-foreground/10 rounded-lg">
                                                        <Label className="text-xs text-muted-foreground">Lvl {level}</Label>
                                                        <span className="text-lg font-bold">{slots.current}/{slots.max}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3 text-sm">
                                        {knownSpells.length > 0 ? knownSpells.map(spell => (
                                          <div key={spell.name} className="group relative">
                                              <h4 className="font-semibold">{spell.name} <span className="text-xs text-muted-foreground">({spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`}, {spell.school})</span></h4>
                                              <p className="text-sm text-muted-foreground mt-1">{spell.text}</p>
                                          </div>
                                        )) : <p className="text-sm text-muted-foreground text-center py-2">No spells known.</p>}
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                    <Users className="h-12 w-12 mb-4" />
                    <h3 className="font-semibold">Player Characters</h3>
                    <p>Select a player on the map or from the list above.</p>
                </div>
            )}
        </ScrollArea>
    </div>
  );
}
