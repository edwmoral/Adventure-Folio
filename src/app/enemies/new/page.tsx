
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Enemy } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STORAGE_KEY = 'dnd_enemies';

const CREATURE_TYPES = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'];
const ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil', 'Unaligned'];
const CHALLENGE_RATINGS = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '30'];


export default function NewEnemyPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [enemy, setEnemy] = useState<Partial<Enemy>>({
    name: '',
    type: 'Humanoid',
    alignment: 'Unaligned',
    challenge_rating: '0',
    hit_points: 10,
    armor_class: 10,
    speed: '30 ft.',
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    description: '',
    tokenImageUrl: 'https://placehold.co/48x48.png',
    senses: '',
    languages: '',
    traits: '',
    actions: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isNumber = type === 'number';
    setEnemy(prev => ({ ...prev, [id]: isNumber ? parseInt(value) : value }));
  };
  
  const handleSelectChange = (id: keyof Enemy, value: string) => {
    setEnemy(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!enemy.name || !enemy.type || !enemy.alignment) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name, Type, and Alignment are required.' });
        return;
    }

    try {
        const storedEnemies = localStorage.getItem(STORAGE_KEY);
        const enemies: Enemy[] = storedEnemies ? JSON.parse(storedEnemies) : [];
        
        const newEnemy: Enemy = {
            id: `enemy-${Date.now()}`,
            name: enemy.name,
            type: enemy.type,
            alignment: enemy.alignment,
            challenge_rating: enemy.challenge_rating || '0',
            hit_points: Number(enemy.hit_points) || 10,
            armor_class: Number(enemy.armor_class) || 10,
            speed: enemy.speed || '30 ft.',
            str: Number(enemy.str) || 10,
            dex: Number(enemy.dex) || 10,
            con: Number(enemy.con) || 10,
            int: Number(enemy.int) || 10,
            wis: Number(enemy.wis) || 10,
            cha: Number(enemy.cha) || 10,
            senses: enemy.senses || '',
            languages: enemy.languages || '',
            traits: enemy.traits || '',
            actions: enemy.actions || '',
            description: enemy.description || '',
            tokenImageUrl: enemy.tokenImageUrl || 'https://placehold.co/48x48.png',
        };

        const updatedEnemies = [...enemies, newEnemy];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEnemies));

        toast({ title: "Enemy Created!", description: "The new enemy has been added to your bestiary." });
        router.push(`/enemies`);

    } catch (error) {
        console.error("Failed to create enemy:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new enemy." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/enemies">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Enemies
             </Link>
        </Button>
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Enemy</CardTitle>
                <CardDescription>
                    Define a new creature for your bestiary. Use comma-separated values for lists.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Enemy Name</Label>
                            <Input id="name" placeholder="e.g., Goblin" value={enemy.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Creature Type</Label>
                            <Select value={enemy.type} onValueChange={(val) => handleSelectChange('type', val)}>
                                <SelectTrigger id="type"><SelectValue/></SelectTrigger>
                                <SelectContent>{CREATURE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="alignment">Alignment</Label>
                            <Select value={enemy.alignment} onValueChange={(val) => handleSelectChange('alignment', val)}>
                                <SelectTrigger id="alignment"><SelectValue/></SelectTrigger>
                                <SelectContent>{ALIGNMENTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={enemy.description} onChange={handleInputChange} />
                    </div>

                    {/* Combat Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="armor_class">Armor Class</Label>
                            <Input id="armor_class" type="number" value={enemy.armor_class} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hit_points">Hit Points</Label>
                            <Input id="hit_points" type="number" value={enemy.hit_points} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speed">Speed</Label>
                            <Input id="speed" value={enemy.speed} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="challenge_rating">Challenge Rating (CR)</Label>
                             <Select value={enemy.challenge_rating} onValueChange={(val) => handleSelectChange('challenge_rating', val)}>
                                <SelectTrigger id="challenge_rating"><SelectValue/></SelectTrigger>
                                <SelectContent>{CHALLENGE_RATINGS.map(cr => <SelectItem key={cr} value={cr}>{cr}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Ability Scores */}
                    <div className="border p-4 rounded-md">
                        <h4 className="font-medium mb-4 text-center">Ability Scores</h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            <div className="space-y-2"><Label htmlFor="str">STR</Label><Input id="str" type="number" value={enemy.str} onChange={handleInputChange}/></div>
                            <div className="space-y-2"><Label htmlFor="dex">DEX</Label><Input id="dex" type="number" value={enemy.dex} onChange={handleInputChange}/></div>
                            <div className="space-y-2"><Label htmlFor="con">CON</Label><Input id="con" type="number" value={enemy.con} onChange={handleInputChange}/></div>
                            <div className="space-y-2"><Label htmlFor="int">INT</Label><Input id="int" type="number" value={enemy.int} onChange={handleInputChange}/></div>
                            <div className="space-y-2"><Label htmlFor="wis">WIS</Label><Input id="wis" type="number" value={enemy.wis} onChange={handleInputChange}/></div>
                            <div className="space-y-2"><Label htmlFor="cha">CHA</Label><Input id="cha" type="number" value={enemy.cha} onChange={handleInputChange}/></div>
                        </div>
                    </div>

                    {/* Text-based fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="senses">Senses</Label><Input id="senses" value={enemy.senses} onChange={handleInputChange} placeholder="e.g. Darkvision 60 ft." /></div>
                        <div className="space-y-2"><Label htmlFor="languages">Languages</Label><Input id="languages" value={enemy.languages} onChange={handleInputChange} placeholder="e.g. Common, Goblin" /></div>
                        <div className="space-y-2"><Label htmlFor="traits">Traits</Label><Textarea id="traits" value={enemy.traits} onChange={handleInputChange} placeholder="Comma-separated traits..." /></div>
                        <div className="space-y-2"><Label htmlFor="actions">Actions</Label><Textarea id="actions" value={enemy.actions} onChange={handleInputChange} placeholder="Comma-separated actions..." /></div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tokenImageUrl">Token Image URL</Label>
                        <Input id="tokenImageUrl" value={enemy.tokenImageUrl} onChange={handleInputChange} />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit">Create Enemy</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
