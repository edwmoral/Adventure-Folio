'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Book, Heart, Shield, Swords, ArrowUp } from "lucide-react"

const StatCard = ({ name, value, modifier }: { name: string, value: string, modifier: string }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-card-foreground/5 rounded-lg">
        <div className="text-xs text-muted-foreground">{name}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-accent font-medium">{modifier}</div>
    </div>
)

export default function CharacterSheetPage() {
    const [character, setCharacter] = useState({
        name: "Eldrin Kael",
        level: 5,
        race: "Elf",
        class: "Ranger",
        avatar: "https://placehold.co/100x100.png",
        tags: ["Archery", "Stealth", "Survival", "Beast Master"],
        stats: {
            str: 12,
            dex: 18,
            con: 14,
            int: 10,
            wis: 16,
            cha: 8,
        },
        hp: 42,
        maxHp: 42,
        ac: 16,
    });

    const getModifier = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const handleLevelUp = () => {
        setCharacter(prev => {
            const newLevel = prev.level + 1;
            const conModifier = Math.floor((prev.stats.con - 10) / 2);
            const hitDieRoll = Math.floor(Math.random() * 10) + 1; // d10 for Ranger
            const hpIncrease = Math.max(1, hitDieRoll + conModifier);
            const newMaxHp = prev.maxHp + hpIncrease;

            return {
                ...prev,
                level: newLevel,
                maxHp: newMaxHp,
                hp: newMaxHp, // Heal to full on level up
            };
        });
    };

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
                                <p className="text-lg text-muted-foreground">Level {character.level} {character.race} {character.class}</p>
                            </div>
                            <Button onClick={handleLevelUp} size="lg" className="mt-4 sm:mt-0">
                                <ArrowUp className="mr-2 h-5 w-5" />
                                Level Up
                            </Button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {character.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
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
                                            <h3 className="font-semibold">Equipped Items</h3>
                                            <ul className="space-y-2">
                                                <li className="flex items-center justify-between"><span>+1 Longbow</span><Badge>Attuned</Badge></li>
                                                <li className="flex items-center justify-between"><span>Studded Leather Armor</span></li>
                                                <li className="flex items-center justify-between"><span>Boots of Elvenkind</span><Badge>Attuned</Badge></li>
                                            </ul>
                                            <Separator />
                                            <h3 className="font-semibold">Backpack</h3>
                                            <p className="text-sm text-muted-foreground">50 ft. of rope, rations (3 days), waterskin, quiver with 20 arrows...</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="spells" className="mt-4">
                               <Card>
                                    <CardContent className="p-6 text-center">
                                       <Book className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                       <h3 className="font-semibold">Spellbook is empty.</h3>
                                       <p className="text-sm text-muted-foreground">As a Ranger, you might gain spells at a higher level.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="features" className="mt-4">
                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                         <div>
                                            <h4 className="font-semibold">Favored Enemy</h4>
                                            <p className="text-sm text-muted-foreground">You have significant experience studying, tracking, hunting, and even talking to a certain type of enemy (e.g., Orcs).</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Natural Explorer</h4>
                                            <p className="text-sm text-muted-foreground">You are particularly familiar with one type of natural environment and are adept at traveling and surviving in such regions.</p>
                                        </div>
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
