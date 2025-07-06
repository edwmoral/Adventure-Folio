
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Monster, MonsterAction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveGlobalDoc } from "@/lib/firestore";

const CREATURE_TYPES = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'].sort();
const ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil', 'Unaligned'].sort();
const CHALLENGE_RATINGS = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '30'];

const parseActions = (text: string): MonsterAction[] => {
    if (!text) return [];
    return text.split('\n').filter(Boolean).map(line => {
        const parts = line.split('. ');
        const name = parts[0];
        const description = parts.slice(1).join('. ');
        return { name, text: description };
    });
}

export default function NewEnemyPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [enemy, setEnemy] = useState<Partial<Monster>>({
    name: '',
    type: 'Humanoid',
    alignment: 'Unaligned',
    cr: '0',
    hp: '10',
    ac: '10',
    speed: '30 ft.',
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    description: '',
    tokenImageUrl: 'https://placehold.co/48x48.png',
    senses: '',
    languages: '',
  });
  
  const [traitsText, setTraitsText] = useState('');
  const [actionsText, setActionsText] = useState('');
  const [legendaryActionsText, setLegendaryActionsText] = useState('');
  const [reactionsText, setReactionsText] = useState('');


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isNumber = type === 'number';
    setEnemy(prev => ({ ...prev, [id]: isNumber ? parseInt(value) : value }));
  };
  
  const handleSelectChange = (id: keyof Monster, value: string) => {
    setEnemy(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!enemy.name || !enemy.type || !enemy.alignment) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name, Type, and Alignment are required.' });
        return;
    }

    try {
        const newEnemyId = `enemy-${Date.now()}`;
        
        const newEnemy: Monster = {
            id: newEnemyId,
            name: enemy.name!,
            type: enemy.type!,
            alignment: enemy.alignment!,
            cr: enemy.cr || '0',
            hp: enemy.hp!,
            ac: enemy.ac!,
            speed: enemy.speed || '30 ft.',
            str: Number(enemy.str) || 10,
            dex: Number(enemy.dex) || 10,
            con: Number(enemy.con) || 10,
            int: Number(enemy.int) || 10,
            wis: Number(enemy.wis) || 10,
            cha: Number(enemy.cha) || 10,
            senses: enemy.senses || '',
            languages: enemy.languages || '',
            trait: parseActions(traitsText),
            action: parseActions(actionsText),
            legendary: parseActions(legendaryActionsText),
            reaction: parseActions(reactionsText),
            description: enemy.description || '',
            tokenImageUrl: enemy.tokenImageUrl || 'https://placehold.co/48x48.png',
        };

        await saveGlobalDoc('enemies', newEnemyId, newEnemy);

        toast({ title: "Creature Created!", description: "The new creature has been added to your bestiary." });
        router.push(`/enemies`);

    } catch (error) {
        console.error("Failed to create creature:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new creature." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/enemies">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bestiary
             </Link>
        </Button>
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Creature</CardTitle>
                <CardDescription>
                    Define a new creature for your bestiary. Use new lines for separate actions/traits.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Creature Name</Label>
                            <Input id="name" placeholder="e.g., Owlbear" value={enemy.name} onChange={handleInputChange} required />
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ac">Armor Class</Label>
                            <Input id="ac" type="text" value={enemy.ac || ''} onChange={handleInputChange} placeholder="e.g., 15 (natural armor)" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hp">Hit Points</Label>
                            <Input id="hp" type="text" value={enemy.hp || ''} onChange={handleInputChange} placeholder="e.g., 7 (2d6)" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="speed">Speed</Label>
                            <Input id="speed" value={enemy.speed} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cr">Challenge Rating (CR)</Label>
                             <Select value={enemy.cr} onValueChange={(val) => handleSelectChange('cr', val)}>
                                <SelectTrigger id="cr"><SelectValue/></SelectTrigger>
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
                        <div className="space-y-2"><Label htmlFor="traits">Traits</Label><Textarea id="traits" value={traitsText} onChange={(e) => setTraitsText(e.target.value)} placeholder="Trait Name. Description..." /></div>
                        <div className="space-y-2"><Label htmlFor="actions">Actions</Label><Textarea id="actions" value={actionsText} onChange={(e) => setActionsText(e.target.value)} placeholder="Action Name. Description..." /></div>
                        <div className="space-y-2"><Label htmlFor="legendaryActions">Legendary Actions</Label><Textarea id="legendaryActions" value={legendaryActionsText} onChange={(e) => setLegendaryActionsText(e.target.value)} placeholder="Action Name. Description..." /></div>
                        <div className="space-y-2"><Label htmlFor="reactions">Reactions</Label><Textarea id="reactions" value={reactionsText} onChange={(e) => setReactionsText(e.target.value)} placeholder="Action Name. Description..." /></div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tokenImageUrl">Token Image URL</Label>
                        <Input id="tokenImageUrl" value={enemy.tokenImageUrl} onChange={handleInputChange} />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit">Create Creature</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
