'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Book, Heart, Shield, Swords, ArrowUp, UserPlus, Sparkles, Target, Users, X, ChevronDown, BookOpen, PlusCircle, Trash2 } from "lucide-react"
import type { PlayerCharacter, Class, Action, Spell, Skill } from "@/lib/types";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { fullCasterSpellSlots } from "@/lib/dnd-data";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { getGlobalCollection, getCollectionForUser, saveDocForUser, deleteGlobalDoc, getUserCollection } from "@/lib/firestore";

const getHitDieAverage = (hitDie: string): number => {
    switch (hitDie) {
        case 'd6': return 4;
        case 'd8': return 5;
        case 'd10': return 6;
        case 'd12': return 7;
        default: 
            const dieValue = parseInt(hitDie.replace('d', ''));
            if (isNaN(dieValue)) return 1;
            return Math.floor(dieValue / 2) + 1;
    }
};

const StatCard = ({ name, value, modifier }: { name: string, value: string, modifier: string }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-card-foreground/5 rounded-lg">
        <div className="text-xs text-muted-foreground">{name}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-accent font-medium">{modifier}</div>
    </div>
);

const STORAGE_KEY_LAST_ACTIVE_CHARACTER = 'dnd_last_active_character_id';

export default function CharacterSheetPage() {
    const { user } = useAuth();
    const [allPlayerCharacters, setAllPlayerCharacters] = useState<(PlayerCharacter & { id: string })[]>([]);
    const [character, setCharacter] = useState<(PlayerCharacter & { id: string }) | null>(null);
    const [allClasses, setAllClasses] = useState<Class[]>([]);
    const [characterFeatures, setCharacterFeatures] = useState<{name: string, text: string}[]>([]);
    const [allActions, setAllActions] = useState<Action[]>([]);
    const [allSpells, setAllSpells] = useState<Spell[]>([]);
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    // State for level up modals
    const [levelUpDialogOpen, setLevelUpDialogOpen] = useState(false);
    const [levelUpSummaryOpen, setLevelUpSummaryOpen] = useState(false);
    const [newlyUnlockedFeatures, setNewlyUnlockedFeatures] = useState<string[]>([]);
    const [hpIncreaseResult, setHpIncreaseResult] = useState(0);
    const [newSpellSlotsSummary, setNewSpellSlotsSummary] = useState<string[]>([]);
    const [newSpellsToChooseSummary, setNewSpellsToChooseSummary] = useState('');

    // State for spell management
    const [addSpellDialogOpen, setAddSpellDialogOpen] = useState(false);
    const [spellToAdd, setSpellToAdd] = useState('');

    // State for delete character modal
    const [characterToDelete, setCharacterToDelete] = useState<(PlayerCharacter & { id: string }) | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [chars, classes, actions, spells, skills] = await Promise.all([
                    getCollectionForUser<PlayerCharacter>('playerCharacters'),
                    getGlobalCollection<Class>('classes'),
                    getUserCollection<Action>('actions'),
                    getGlobalCollection<Spell>('spells'),
                    getGlobalCollection<Skill>('skills'),
                ]);

                setAllPlayerCharacters(chars);
                setAllClasses(classes);
                setAllActions(actions);
                setAllSpells(spells);
                setAllSkills(skills);

                if (chars.length > 0) {
                    const lastActiveId = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE_CHARACTER);
                    const lastActiveCharacter = chars.find(c => c.id === lastActiveId);
                    setCharacter(lastActiveCharacter || chars[0]);
                }
            } catch (error) {
                console.error("Failed to load data from Firestore", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load character data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, toast]);

    useEffect(() => {
        if (character && allClasses.length > 0) {
            const characterClass = allClasses.find(
                c => c.name === character.className && c.subclass === character.subclass
            );

            if (characterClass) {
                const features = characterClass.levels
                    .filter(l => l.level <= character.level)
                    .flatMap(l => l.feature || [])
                    .map(f => ({ name: f.name, description: f.text }));
                setCharacterFeatures(features);
            }
        }
    }, [character, allClasses]);


    const getModifier = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const getModifierValue = (score: number) => {
        return Math.floor((score - 10) / 2);
    }
    
    const getProficiencyBonus = (level: number) => {
        return Math.ceil(1 + level / 4);
    };

    const handleHpIncrease = async (method: 'roll' | 'average') => {
        if (!character) return;

        const characterClass = allClasses.find(c => c.name === character.className && c.subclass === character.subclass);
        if (!characterClass) {
            toast({ variant: "destructive", title: "Error", description: "Could not find class data to level up." });
            return;
        }

        const conModifier = Math.floor((character.stats.con - 10) / 2);
        let hpIncrease = 0;

        if (method === 'average') {
            const averageRoll = getHitDieAverage(characterClass.hit_die);
            hpIncrease = averageRoll + conModifier;
        } else { // 'roll'
            const hitDieValue = parseInt(characterClass.hit_die.replace('d', ''));
            const roll = Math.floor(Math.random() * hitDieValue) + 1;
            hpIncrease = roll + conModifier;
        }
        hpIncrease = Math.max(1, hpIncrease); // HP increase is always at least 1
        setHpIncreaseResult(hpIncrease);

        const newLevel = character.level + 1;
        const newMaxHp = character.maxHp + hpIncrease;
        
        const newFeatures = characterClass.levels.find(l => l.level === newLevel)?.features || [];
        setNewlyUnlockedFeatures(newFeatures.map(f => f.name));

        let newSpellSlots = character.spell_slots;
        const spellSlotsSummary: string[] = [];
        let spellsToChooseSummary = '';

        const isCaster = characterClass.spellcasting_type && characterClass.spellcasting_type !== 'none';
        
        if (isCaster) {
            const halfCasters = ['Ranger', 'Paladin'];
            
            let casterLevel = halfCasters.includes(characterClass.name) ? Math.floor(newLevel / 2) : newLevel;

            const oldSlots = character.spell_slots || {};
            const levelData = fullCasterSpellSlots.find(l => l.level === casterLevel);
            
            if (levelData) {
                const newMaxSlots = levelData.slots;
                const updatedSlots: PlayerCharacter['spell_slots'] = {...character.spell_slots};

                for (const levelKey in newMaxSlots) {
                    if (Object.prototype.hasOwnProperty.call(newMaxSlots, levelKey)) {
                        const max = newMaxSlots[levelKey as keyof typeof newMaxSlots];
                        const oldMax = oldSlots[levelKey]?.max || 0;
                        if (max > oldMax || (max > 0 && !oldSlots[levelKey])) {
                            updatedSlots[levelKey] = { current: max, max: max };
                            spellSlotsSummary.push(`Level ${levelKey} slots: ${oldMax} -> ${max}`);
                        }
                    }
                }
                newSpellSlots = updatedSlots;
            }

            if (characterClass.spellcasting_type === 'prepared') {
                const spellcastingAbility = characterClass.primary_ability.toLowerCase().substring(0, 3) as keyof PlayerCharacter['stats'];
                const abilityModifier = getModifierValue(character.stats[spellcastingAbility]);
                const preparableSpells = Math.max(1, newLevel + abilityModifier);
                spellsToChooseSummary = `You can now prepare up to ${preparableSpells} spells each day.`;
                if (characterClass.name === 'Wizard') {
                    spellsToChooseSummary += ' You also add two new spells to your spellbook.';
                }
            } else if (characterClass.spellcasting_type === 'known') {
                spellsToChooseSummary = `You can learn one new spell. You know ${character.spells?.length || 0} spells.`;
            }
        }
        setNewSpellSlotsSummary(spellSlotsSummary);
        setNewSpellsToChooseSummary(spellsToChooseSummary);

        const updatedCharacterData: PlayerCharacter = {
            ...character,
            level: newLevel,
            maxHp: newMaxHp,
            hp: newMaxHp,
            spell_slots: newSpellSlots,
        };
        const { id, ...charToSave } = updatedCharacterData;


        try {
            await saveDocForUser('playerCharacters', id, charToSave);
            const updatedAllCharacters = allPlayerCharacters.map(pc => pc.id === id ? updatedCharacterData : pc);
            setAllPlayerCharacters(updatedAllCharacters);
            setCharacter(updatedCharacterData);
        } catch (error) {
            console.error("Failed to save level-up changes", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save level-up progress." });
            return;
        }

        setLevelUpDialogOpen(false);
        setLevelUpSummaryOpen(true);
    };
    
    const handleCharacterChange = (characterId: string) => {
        const selected = allPlayerCharacters.find(c => c.id === characterId);
        if (selected) {
            setCharacter(selected);
            localStorage.setItem(STORAGE_KEY_LAST_ACTIVE_CHARACTER, characterId);
        }
    };
    
    const handleDeleteClick = (e: React.MouseEvent, characterId: string) => {
        e.stopPropagation();
        e.preventDefault();
        const charToDelete = allPlayerCharacters.find(c => c.id === characterId);
        if (charToDelete) {
            setCharacterToDelete(charToDelete);
        }
    };
    
    const confirmDelete = async () => {
        if (!characterToDelete || !user) return;

        try {
            await deleteGlobalDoc('playerCharacters', characterToDelete.id);
            const updatedCharacters = allPlayerCharacters.filter(pc => pc.id !== characterToDelete.id);
            setAllPlayerCharacters(updatedCharacters);

            toast({ title: "Character Deleted", description: `"${characterToDelete.name}" has been successfully removed.` });
            
            if (character?.id === characterToDelete.id) {
                if (updatedCharacters.length > 0) {
                    const newActiveCharacter = updatedCharacters[0];
                    setCharacter(newActiveCharacter);
                    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE_CHARACTER, newActiveCharacter.id);
                } else {
                    setCharacter(null);
                    localStorage.removeItem(STORAGE_KEY_LAST_ACTIVE_CHARACTER);
                }
            }
        } catch (error) {
            console.error("Failed to delete character:", error);
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the character." });
        } finally {
            setCharacterToDelete(null);
        }
    };

    const handleAddSpell = async () => {
        if (!character || !spellToAdd) return;
        
        const updatedSpells = [...(character.spells || []), spellToAdd].sort();
        
        const updatedCharacterData: PlayerCharacter & { id: string } = {
            ...character,
            spells: updatedSpells,
        };
        
        const { id, ...charToSave } = updatedCharacterData;

        try {
            await saveDocForUser('playerCharacters', id, charToSave);
            
            const updatedAllCharacters = allPlayerCharacters.map(pc => pc.id === id ? updatedCharacterData : pc);
            setAllPlayerCharacters(updatedAllCharacters);
            setCharacter(updatedCharacterData);

            setSpellToAdd('');
            setAddSpellDialogOpen(false);
            toast({ title: 'Spell Added!', description: `"${spellToAdd}" has been added to the grimoire.` });
        } catch (error) {
            console.error("Failed to add spell:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add the spell.' });
        }
    };

    const handleRemoveSpell = async (spellNameToRemove: string) => {
        if (!character) return;
        
        const updatedSpells = character.spells?.filter(s => s !== spellNameToRemove) || [];
        
        const updatedCharacterData: PlayerCharacter & { id: string } = {
            ...character,
            spells: updatedSpells,
        };
        
        const { id, ...charToSave } = updatedCharacterData;

        try {
            await saveDocForUser('playerCharacters', id, charToSave);
            const updatedAllCharacters = allPlayerCharacters.map(pc => pc.id === id ? updatedCharacterData : pc);
            setAllPlayerCharacters(updatedAllCharacters);
            setCharacter(updatedCharacterData);
            toast({ title: 'Spell Removed!', description: `"${spellNameToRemove}" has been removed from the grimoire.` });
        } catch (error) {
            console.error("Failed to remove spell:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not remove the spell.' });
        }
    };
    
    if (loading) {
        return <div className="text-center p-8">Loading character data...</div>;
    }

    if (allPlayerCharacters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle>No Characters Found</CardTitle>
                        <CardDescription>You haven't created any characters yet. Let's forge your first hero!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg">
                            <Link href="/character/create">
                                <UserPlus className="mr-2 h-5 w-5" />
                                Create a Character
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!character) {
        return <div className="text-center">Select a character...</div>;
    }

    const proficiencyBonus = getProficiencyBonus(character.level);
    const strModifier = getModifierValue(character.stats.str);

    const getAbilityModifier = (ability: string) => {
        switch (ability.toLowerCase()) {
            case 'strength': return getModifier(character.stats.str);
            case 'dexterity': return getModifier(character.stats.dex);
            case 'constitution': return getModifier(character.stats.con);
            case 'intelligence': return getModifier(character.stats.int);
            case 'wisdom': return getModifier(character.stats.wis);
            case 'charisma': return getModifier(character.stats.cha);
            default: return '+0';
        }
    };
    
    const basicActions: Action[] = [
        { name: 'Unarmed Strike', type: 'Action', action_type: 'Standard', description: 'A basic attack with your fists. You are proficient with your unarmed strikes.', usage: { type: 'At Will' }, effects: `Damage: ${1 + strModifier} bludgeoning.` },
        { name: 'Weapon Attack', type: 'Action', action_type: 'Standard', description: 'A basic attack with your currently equipped weapon. Assumes proficiency.', usage: { type: 'At Will' }, effects: `To Hit: +${strModifier + proficiencyBonus}, Damage: 1d8 + ${strModifier} slashing (assumed longsword).` },
        { name: 'Grapple', type: 'Action', action_type: 'Standard', description: "You attempt to grapple a creature using a contested Strength (Athletics) check.", usage: { type: 'At Will' } }
    ];

    const knownSpells = allSpells.filter(spell => character.spells?.includes(spell.name));
    const availableSpells = allSpells.filter(spell => !character.spells?.includes(spell.name));

    return (
        <TooltipProvider>
            <div className="max-w-7xl mx-auto space-y-8">
                {allPlayerCharacters.length > 1 && (
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <Label className="font-semibold">Switch Character:</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-[350px] justify-between">
                                        <span>{character.name} - Lvl {character.level} {character.className}</span>
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[350px]" align="start">
                                    <DropdownMenuRadioGroup value={character.id} onValueChange={handleCharacterChange}>
                                        {allPlayerCharacters.map(pc => (
                                            <DropdownMenuRadioItem key={pc.id} value={pc.id}>
                                                <div className="flex justify-between items-center w-full">
                                                    <span>{pc.name} - Lvl {pc.level} {pc.className}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-destructive/20 ml-2" onClick={(e) => handleDeleteClick(e, pc.id)} onPointerDown={(e) => e.stopPropagation()} >
                                                        <X className="h-4 w-4 text-destructive" />
                                                        <span className="sr-only">Delete {pc.name}</span>
                                                    </Button>
                                                </div>
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <Avatar className="w-24 h-24 border-4 border-primary">
                        <AvatarImage src={character.avatar} data-ai-hint="fantasy character" alt="Character Portrait" />
                        <AvatarFallback>{character.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-4xl font-bold font-headline">{character.name}</h1>
                                <p className="text-lg text-muted-foreground">Level {character.level} {character.race} {character.className} ({character.subclass})</p>
                            </div>
                            <AlertDialog open={levelUpDialogOpen} onOpenChange={setLevelUpDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button size="lg" className="mt-4 sm:mt-0"> <ArrowUp className="mr-2 h-5 w-5" /> Level Up </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Increase Hit Points</AlertDialogTitle>
                                        <AlertDialogDescription> Choose how to increase your maximum HP for reaching Level {character.level + 1}. Your Constitution modifier is {getModifier(character.stats.con)}. </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleHpIncrease('average')}>Take Average</AlertDialogAction>
                                        <AlertDialogAction onClick={() => handleHpIncrease('roll')}>Roll for HP</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline">{character.race}</Badge>
                            <Badge variant="outline">{character.className}</Badge>
                            <Badge variant="outline">{character.subclass}</Badge>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-8">
                        <Card>
                             <CardHeader> <CardTitle>Ability Scores</CardTitle> </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-2">
                                <StatCard name="STR" value={String(character.stats.str)} modifier={getModifier(character.stats.str)} />
                                <StatCard name="DEX" value={String(character.stats.dex)} modifier={getModifier(character.stats.dex)} />
                                <StatCard name="CON" value={String(character.stats.con)} modifier={getModifier(character.stats.con)} />
                                <StatCard name="INT" value={String(character.stats.int)} modifier={getModifier(character.stats.int)} />
                                <StatCard name="WIS" value={String(character.stats.wis)} modifier={getModifier(character.stats.wis)} />
                                <StatCard name="CHA" value={String(character.stats.cha)} modifier={getModifier(character.stats.cha)} />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader> <CardTitle>Vitals & Combat</CardTitle> </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center"> <span className="font-medium flex items-center gap-2"><Heart className="text-destructive" /> Hit Points</span> <span className="font-bold text-lg">{character.hp} / {character.maxHp}</span> </div>
                                <div className="flex justify-between items-center"> <span className="font-medium flex items-center gap-2"><Shield /> Armor Class</span> <span className="font-bold text-lg">{character.ac}</span> </div>
                                 <div className="flex justify-between items-center"> <span className="font-medium flex items-center gap-2"><Swords /> Initiative</span> <span className="font-bold text-lg">{getModifier(character.stats.dex)}</span> </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader> <CardTitle>Skills</CardTitle> </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                {allSkills.map(skill => (
                                    <div key={skill.name} className="flex justify-between">
                                        <span>{skill.name} <span className="text-muted-foreground text-xs">({skill.ability.substring(0,3)})</span></span>
                                        <span className="font-medium">{getAbilityModifier(skill.ability)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2">
                        <Tabs defaultValue="actions" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="actions">Combat & Abilities</TabsTrigger>
                                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                            </TabsList>
                            <TabsContent value="actions" className="mt-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <Accordion type="multiple" defaultValue={['actions']} className="w-full space-y-1">
                                            <AccordionItem value="actions">
                                                <AccordionTrigger className="text-2xl font-semibold hover:no-underline"> <div className="flex items-center gap-2"><Swords className="h-6 w-6" /> Actions</div> </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-4 pt-4 border-t mt-2">
                                                        {[...basicActions, ...allActions].map((action, index) => (
                                                            <div key={`${action.name}-${index}`}>
                                                                <h4 className="font-semibold">{action.name} <Badge variant="secondary">{action.type}</Badge></h4>
                                                                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                                                                {action.effects && ( <div className="text-sm mt-1 flex items-start gap-2"> <Target className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" /> <span>{action.effects}</span> </div> )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>

                                            <AccordionItem value="spells">
                                                <AccordionTrigger className="text-2xl font-semibold hover:no-underline"> <div className="flex items-center gap-2"><Book className="h-6 w-6" /> Spells</div> </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-4 pt-4 border-t mt-2">
                                                        {character.spell_slots && Object.keys(character.spell_slots).length > 0 && (
                                                            <div className="mb-4">
                                                                <h4 className="font-semibold mb-2">Spell Slots</h4>
                                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                    {Object.entries(character.spell_slots).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([level, slots]) => (
                                                                        <div key={level} className="flex flex-col items-center justify-center p-2 bg-card-foreground/10 rounded-lg">
                                                                            <Label className="text-xs text-muted-foreground">Level {level}</Label>
                                                                            <span className="text-lg font-bold">{slots.current}/{slots.max}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <Dialog open={addSpellDialogOpen} onOpenChange={setAddSpellDialogOpen}>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" className="w-full"> <PlusCircle className="mr-2 h-4 w-4" /> Add Spell to Grimoire </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Add a Spell</DialogTitle>
                                                                    <DialogDescription> Choose a spell to add to {character.name}'s known spells. </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="py-4">
                                                                    <Label htmlFor="spell-select">Available Spells</Label>
                                                                    <Select value={spellToAdd} onValueChange={setSpellToAdd}>
                                                                        <SelectTrigger id="spell-select"> <SelectValue placeholder="Select a spell..." /> </SelectTrigger>
                                                                        <SelectContent>
                                                                            {availableSpells.map(spell => ( <SelectItem key={spell.name} value={spell.name}> {spell.name} (Lvl {spell.level}) </SelectItem> ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button variant="ghost" onClick={() => setAddSpellDialogOpen(false)}>Cancel</Button>
                                                                    <Button onClick={handleAddSpell} disabled={!spellToAdd}>Add Spell</Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>

                                                        <Separator />
                                                        
                                                        {knownSpells.length > 0 ? (
                                                            knownSpells.map(spell => (
                                                              <div key={spell.name} className="group relative pr-8">
                                                                  <h4 className="font-semibold">{spell.name} <span className="text-xs text-muted-foreground">({spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`}, {spell.school})</span></h4>
                                                                  <p className="text-sm text-muted-foreground mt-1">{spell.text}</p>
                                                                  <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveSpell(spell.name)} >
                                                                    <Trash2 className="h-4 w-4 text-destructive" /> <span className="sr-only">Remove {spell.name}</span>
                                                                  </Button>
                                                              </div>
                                                            ))
                                                        ) : ( <div className="text-center text-muted-foreground py-4"> <Book className="mx-auto h-8 w-8 mb-2" /> <p className="text-sm">No spells added to the grimoire yet.</p> </div> )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                            
                                            <AccordionItem value="features">
                                                <AccordionTrigger className="text-xl font-semibold hover:no-underline"> <div className="flex items-center gap-2"><Sparkles className="h-6 w-6" /> Features & Traits</div> </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-4 pt-4 border-t mt-2">
                                                        {characterFeatures.length > 0 ? (
                                                            characterFeatures.map(feature => (
                                                                <div key={feature.name}>
                                                                    <h4 className="font-semibold">{feature.name}</h4>
                                                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                                                </div>
                                                            ))
                                                        ) : ( <p className="text-sm text-muted-foreground">No special features found for this class at the current level.</p> )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="inventory" className="mt-4">
                                <Card>
                                    <CardContent className="p-6"> <div className="space-y-4"> <h3 className="font-semibold">Backpack</h3> <p className="text-sm text-muted-foreground">Inventory management coming soon...</p> </div> </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            <AlertDialog open={levelUpSummaryOpen} onOpenChange={setLevelUpSummaryOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-2xl">Level Up! 🎉</AlertDialogTitle>
                        <AlertDialogDescription className="text-center"> Congratulations, you are now Level {character.level}! </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 my-4">
                        <p className="text-center font-semibold">Your maximum HP increased by <span className="text-accent">{hpIncreaseResult}</span>!</p>
                        
                        {newlyUnlockedFeatures.length > 0 && (
                            <div>
                                <h4 className="font-bold mb-2 flex items-center justify-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> New Features Unlocked:</h4>
                                <ul className="list-disc list-inside bg-card-foreground/5 p-3 rounded-md text-sm">
                                    {newlyUnlockedFeatures.map(feature => <li key={feature}>{feature}</li>)}
                                </ul>
                            </div>
                        )}

                        {(newSpellSlotsSummary.length > 0 || newSpellsToChooseSummary) && (
                             <div>
                                <h4 className="font-bold mb-2 flex items-center justify-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Spellcasting Changes:</h4>
                                <div className="text-sm bg-card-foreground/5 p-3 rounded-md space-y-1">
                                    {newSpellSlotsSummary.map(summary => ( <p key={summary}>{summary}</p> ))}
                                    {newSpellsToChooseSummary && <p>{newSpellsToChooseSummary}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter> <AlertDialogAction onClick={() => setLevelUpSummaryOpen(false)}>Awesome!</AlertDialogAction> </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!characterToDelete} onOpenChange={(open) => !open && setCharacterToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this character?</AlertDialogTitle>
                        <AlertDialogDescription> This will permanently delete "{characterToDelete?.name}". This action cannot be undone. </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCharacterToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Character</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );
}
