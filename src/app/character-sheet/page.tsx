
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
import { Book, Heart, Shield, Swords, ArrowUp, UserPlus, Sparkles } from "lucide-react"
import type { PlayerCharacter, Class } from "@/lib/types";
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
import { useToast } from "@/hooks/use-toast";

const StatCard = ({ name, value, modifier }: { name: string, value: string, modifier: string }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-card-foreground/5 rounded-lg">
        <div className="text-xs text-muted-foreground">{name}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-accent font-medium">{modifier}</div>
    </div>
);

const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';
const STORAGE_KEY_CLASSES = 'dnd_classes';

export default function CharacterSheetPage() {
    const [character, setCharacter] = useState<PlayerCharacter | null>(null);
    const [allClasses, setAllClasses] = useState<Class[]>([]);
    const [characterFeatures, setCharacterFeatures] = useState<{name: string, description: string}[]>([]);
    const { toast } = useToast();

    // State for level up modals
    const [levelUpDialogOpen, setLevelUpDialogOpen] = useState(false);
    const [levelUpSummaryOpen, setLevelUpSummaryOpen] = useState(false);
    const [newlyUnlockedFeatures, setNewlyUnlockedFeatures] = useState<string[]>([]);
    const [hpIncreaseResult, setHpIncreaseResult] = useState(0);

    useEffect(() => {
        try {
            const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
            if (storedCharacters) {
                const playerCharacters: PlayerCharacter[] = JSON.parse(storedCharacters);
                if (playerCharacters.length > 0) {
                    // For now, load the first character
                    setCharacter(playerCharacters[0]);
                }
            }

            const storedClasses = localStorage.getItem(STORAGE_KEY_CLASSES);
            if (storedClasses) {
                setAllClasses(JSON.parse(storedClasses));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);

    useEffect(() => {
        if (character && allClasses.length > 0) {
            const characterClass = allClasses.find(
                c => c.name === character.className && c.subclass === character.subclass
            );

            if (characterClass) {
                const features = characterClass.levels
                    .filter(l => l.level <= character.level)
                    .flatMap(l => l.features)
                    .map(name => ({ name, description: "Feature description from class data would go here." })); 
                setCharacterFeatures(features);
            }
        }
    }, [character, allClasses]);


    const getModifier = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const handleHpIncrease = (method: 'roll' | 'average') => {
        if (!character) return;

        const characterClass = allClasses.find(c => c.name === character.className && c.subclass === character.subclass);
        if (!characterClass) {
            toast({ variant: "destructive", title: "Error", description: "Could not find class data to level up." });
            return;
        }

        const hitDieValue = parseInt(characterClass.hit_die.replace('d', ''));
        const conModifier = Math.floor((character.stats.con - 10) / 2);
        let hpIncrease = 0;

        if (method === 'average') {
            hpIncrease = Math.floor(hitDieValue / 2) + 1 + conModifier;
        } else { // 'roll'
            const roll = Math.floor(Math.random() * hitDieValue) + 1;
            hpIncrease = roll + conModifier;
        }
        hpIncrease = Math.max(1, hpIncrease); // HP increase is always at least 1
        setHpIncreaseResult(hpIncrease);

        const newLevel = character.level + 1;
        const newMaxHp = character.maxHp + hpIncrease;
        
        const newFeatures = characterClass.levels.find(l => l.level === newLevel)?.features || [];
        setNewlyUnlockedFeatures(newFeatures);

        const updatedCharacter: PlayerCharacter = {
            ...character,
            level: newLevel,
            maxHp: newMaxHp,
            hp: newMaxHp, // Heal to full on level up
        };

        try {
            const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
            const playerCharacters: PlayerCharacter[] = storedCharacters ? JSON.parse(storedCharacters) : [];
            const characterIndex = playerCharacters.findIndex(c => c.id === character.id);
            
            if (characterIndex !== -1) {
                playerCharacters[characterIndex] = updatedCharacter;
                localStorage.setItem(STORAGE_KEY_PLAYER_CHARACTERS, JSON.stringify(playerCharacters));
            }
        } catch (error) {
            console.error("Failed to save level-up changes", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save level-up progress." });
            return;
        }

        setCharacter(updatedCharacter);
        setLevelUpDialogOpen(false);
        setLevelUpSummaryOpen(true);
    };

    if (!character) {
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

    return (
        <TooltipProvider>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
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
                                    <Button size="lg" className="mt-4 sm:mt-0">
                                        <ArrowUp className="mr-2 h-5 w-5" />
                                        Level Up
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Increase Hit Points</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Choose how to increase your maximum HP for reaching Level {character.level + 1}.
                                            Your Constitution modifier is {getModifier(character.stats.con)}.
                                        </AlertDialogDescription>
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

                {/* Main Content */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Skills */}
                    <div className="md:col-span-1 space-y-8">
                        <Card>
                             <CardHeader>
                                <CardTitle>Ability Scores</CardTitle>
                            </CardHeader>
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
                            <CardHeader>
                                <CardTitle>Vitals & Combat</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-2"><Heart className="text-destructive" /> Hit Points</span>
                                    <span className="font-bold text-lg">{character.hp} / {character.maxHp}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-2"><Shield /> Armor Class</span>
                                    <span className="font-bold text-lg">{character.ac}</span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-2"><Swords /> Initiative</span>
                                    <span className="font-bold text-lg">{getModifier(character.stats.dex)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Tabs */}
                    <div className="md:col-span-2">
                        <Tabs defaultValue="inventory" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                                <TabsTrigger value="spells">Spells</TabsTrigger>
                                <TabsTrigger value="features">Features & Traits</TabsTrigger>
                            </TabsList>
                            <TabsContent value="inventory" className="mt-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold">Backpack</h3>
                                            <p className="text-sm text-muted-foreground">Inventory management coming soon...</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="spells" className="mt-4">
                               <Card>
                                    <CardContent className="p-6 text-center">
                                       <Book className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                       <h3 className="font-semibold">Spellbook is empty.</h3>
                                       <p className="text-sm text-muted-foreground">Spell management coming soon...</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="features" className="mt-4">
                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                        {characterFeatures.length > 0 ? (
                                            characterFeatures.map(feature => (
                                                <div key={feature.name}>
                                                    <h4 className="font-semibold">{feature.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No special features found for this class at the current level.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Level Up Summary Modal */}
            <AlertDialog open={levelUpSummaryOpen} onOpenChange={setLevelUpSummaryOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-2xl">Level Up! 🎉</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            Congratulations, you are now Level {character.level}!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        <p className="text-center font-semibold">Your maximum HP increased by <span className="text-accent">{hpIncreaseResult}</span>!</p>
                        {newlyUnlockedFeatures.length > 0 && (
                            <div>
                                <h4 className="font-bold mb-2 flex items-center justify-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> New Features Unlocked:</h4>
                                <ul className="list-disc list-inside bg-card-foreground/5 p-3 rounded-md">
                                    {newlyUnlockedFeatures.map(feature => <li key={feature}>{feature}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setLevelUpSummaryOpen(false)}>Awesome!</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );

    