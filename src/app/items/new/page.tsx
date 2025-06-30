'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Item } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STORAGE_KEY = 'dnd_items';
const ITEM_TYPES = ['Weapon', 'Armor', 'Consumable', 'Wondrous Item', 'Mundane'];
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];
const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder', 'Poison', 'Acid', 'Psychic', 'Necrotic', 'Radiant', 'Force'];

export default function NewItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [item, setItem] = useState<Partial<Item>>({
    name: '',
    type: '',
    rarity: 'Common',
    weight: 0,
    properties: [],
    description: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setItem(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Item, value: string) => {
    setItem(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!item.name || !item.type || !item.rarity) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name, Type, and Rarity are required.' });
        return;
    }

    try {
        const storedItems = localStorage.getItem(STORAGE_KEY);
        const items: Item[] = storedItems ? JSON.parse(storedItems) : [];
        
        const newItem: Item = {
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            weight: Number(item.weight) || 0,
            properties: typeof item.properties === 'string' ? (item.properties as string).split(',').map(s => s.trim()) : [],
            description: item.description || '',
            damage: item.damage,
            damage_type: item.damage_type,
            effect: item.effect,
        };

        const updatedItems = [...items, newItem];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));

        toast({ title: "Item Created!", description: "The new item has been added." });
        router.push(`/items`);

    } catch (error) {
        console.error("Failed to create item:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new item." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/items">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Items
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Item</CardTitle>
                <CardDescription>
                    Define a new item for your inventory.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input id="name" placeholder="e.g., Vorpal Sword" value={item.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Item Type</Label>
                            <Select value={item.type} onValueChange={(val) => handleSelectChange('type', val)}>
                                <SelectTrigger id="type"><SelectValue placeholder="Select a type..." /></SelectTrigger>
                                <SelectContent>
                                    {ITEM_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rarity">Rarity</Label>
                            <Select value={item.rarity} onValueChange={(val) => handleSelectChange('rarity', val)}>
                                <SelectTrigger id="rarity"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {RARITIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="weight">Weight (lbs)</Label>
                            <Input id="weight" type="number" placeholder="e.g., 3" value={item.weight} onChange={handleInputChange} />
                        </div>
                    </div>

                    {item.type === 'Weapon' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label htmlFor="damage">Damage</Label>
                                <Input id="damage" placeholder="e.g., 1d8" value={item.damage} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="damage_type">Damage Type</Label>
                                <Select value={item.damage_type} onValueChange={(val) => handleSelectChange('damage_type', val)}>
                                    <SelectTrigger id="damage_type"><SelectValue placeholder="Select damage type..."/></SelectTrigger>
                                    <SelectContent>
                                        {DAMAGE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Describe the item and its appearance." value={item.description} onChange={handleInputChange} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="properties">Properties (comma-separated)</Label>
                        <Input id="properties" placeholder="e.g., Versatile, Thrown, Finesse" value={item.properties?.join(', ')} onChange={handleInputChange} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="effect">Special Effect</Label>
                        <Input id="effect" placeholder="e.g., Heals 2d4+2 HP, Grants invisibility" value={item.effect} onChange={handleInputChange} />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit">Create Item</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
