
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
import { Book, Heart, Shield, Swords, ArrowUp, UserPlus } from "lucide-react"
import type { PlayerCharacter, Class } from "@/lib/types";

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

    const handleLevelUp = () => {
        if (!character) return;
        
        setCharacter(prev => {
            if (!prev) return null;

            const newLevel = prev.level + 1;
            const conModifier = Math.floor((prev.stats.con - 10) / 2);
            // This is a simplification. Hit die depends on class.
            const hitDieRoll = Math.floor(Math.random() * 10) + 1; 
            const hpIncrease = Math.max(1, hitDieRoll + conModifier);
            const newMaxHp = prev.maxHp + hpIncrease;

            const updatedCharacter = {
                ...prev,
                level: newLevel,
                maxHp: newMaxHp,
                hp: newMaxHp,
            };

            // Note: This does not persist the change. A "Save" button would be needed.
            return updatedCharacter;
        });
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
                            <Button onClick={handleLevelUp} size="lg" className="mt-4 sm:mt-0">
                                <ArrowUp className="mr-2 h-5 w-5" />
                                Level Up
                            </Button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {/* Tags could be derived from skills/features in a more advanced implementation */}
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
        </TooltipProvider>
    );
}
