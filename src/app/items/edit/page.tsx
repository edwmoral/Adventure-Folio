
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectCombobox } from "@/components/multi-select-combobox";
import { getGlobalDoc, saveGlobalDoc } from "@/lib/firestore";

const STORAGE_KEY_PROPERTIES = 'dnd_item_properties';
const STORAGE_KEY_EFFECTS = 'dnd_item_effects';

const ITEM_TYPES = ['Weapon', 'Armor', 'Consumable', 'Wondrous Item', 'Mundane'].sort();
const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder', 'Poison', 'Acid', 'Psychic', 'Necrotic', 'Radiant', 'Force'].sort();
const DEFAULT_PROPERTIES = ['Finesse', 'Light', 'Heavy', 'Two-Handed', 'Versatile', 'Thrown', 'Ammunition', 'Loading', 'Reach'].sort();
const DEFAULT_EFFECTS = ['Grants Advantage', 'Grants Disadvantage', 'Resistance', 'Vulnerability', '+1 Bonus'].sort();


export default function EditItemPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const itemIdParam = searchParams.get('id');
    const [isLoading, setIsLoading] = useState(true);
    
    const [item, setItem] = useState<Partial<Item>>({ name: '', type: 'Mundane', weight: 0, text: '', magic: false, property: [], detail: [] });
    const [allProperties, setAllProperties] = useState<string[]>(DEFAULT_PROPERTIES);
    const [allEffects, setAllEffects] = useState<string[]>(DEFAULT_EFFECTS);

    useEffect(() => {
        const fetchItemData = async () => {
            if (!itemIdParam) {
                router.push('/items');
                return;
            }
            setIsLoading(true);
            try {
                // Fetch dynamic properties from localStorage
                const storedProps = localStorage.getItem(STORAGE_KEY_PROPERTIES);
                if (storedProps) setAllProperties(JSON.parse(storedProps).sort());
                const storedEffects = localStorage.getItem(STORAGE_KEY_EFFECTS);
                if (storedEffects) setAllEffects(JSON.parse(storedEffects).sort());

                // Fetch item data from Firestore
                const foundItem = await getGlobalDoc<Item>('items', itemIdParam);
                if (foundItem) {
                    setItem(foundItem);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Item not found.' });
                    router.push('/items');
                }
            } catch (e) {
                console.error("Failed to load item data", e);
                toast({ variant: 'destructive', title: 'Load Failed', description: 'Could not load item data.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchItemData();
    }, [itemIdParam, router, toast]);

    const handleCreateOption = (type: 'property' | 'effect', value: string) => {
        try {
            if (type === 'property') {
                const newProperties = [...allProperties, value].sort();
                setAllProperties(newProperties);
                localStorage.setItem(STORAGE_KEY_PROPERTIES, JSON.stringify(newProperties));
            } else {
                const newEffects = [...allEffects, value].sort();
                setAllEffects(newEffects);
                localStorage.setItem(STORAGE_KEY_EFFECTS, JSON.stringify(newEffects));
            }
        } catch (e) {
            console.error("Failed to save new option to localStorage", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save new option.' });
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setItem(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: keyof Item, value: string) => {
        setItem(prev => ({ ...prev, [id]: value }));
    };
    
    const handleCheckboxChange = (id: keyof Item, checked: boolean) => {
        setItem(prev => ({ ...prev, [id]: checked }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!itemIdParam) return;

        if (!item.name || !item.type) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name and Type are required.' });
            return;
        }

        try {
            const updatedItem: Item = { ...item as Item };
            await saveGlobalDoc('items', itemIdParam, updatedItem);

            toast({ title: "Item Updated!", description: "The item has been successfully updated." });
            router.push(`/items`);

        } catch (error) {
            console.error("Failed to update item:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update the item." });
        }
    }

    if (isLoading) {
      return <div className="text-center p-8">Loading item data...</div>;
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
                    <CardTitle>Edit Item</CardTitle>
                    <CardDescription>
                        Update the details for "{item.name}".
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
                                <Label htmlFor="weight">Weight (lbs)</Label>
                                <Input id="weight" type="number" placeholder="e.g., 3" value={item.weight} onChange={handleInputChange} />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <Checkbox id="magic" checked={item.magic} onCheckedChange={(checked) => handleCheckboxChange('magic', !!checked)} />
                                <Label htmlFor="magic">Is this a magical item?</Label>
                            </div>
                        </div>

                        {item.type === 'Weapon' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                                <div className="space-y-2">
                                    <Label htmlFor="dmg1">Damage</Label>
                                    <Input id="dmg1" placeholder="e.g., 1d8" value={item.dmg1 || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dmgType">Damage Type</Label>
                                    <Select value={item.dmgType} onValueChange={(val) => handleSelectChange('dmgType', val)}>
                                        <SelectTrigger id="dmgType"><SelectValue placeholder="Select damage type..."/></SelectTrigger>
                                        <SelectContent>
                                            {DAMAGE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="text">Description</Label>
                            <Textarea id="text" placeholder="Describe the item, its appearance, and any non-magical effects." value={item.text || ''} onChange={handleInputChange} required />
                        </div>
                        
                        <div className="space-y-2">
                             <Label htmlFor="property">Properties</Label>
                             <MultiSelectCombobox 
                                options={allProperties}
                                selected={item.property || []}
                                onSelectedChange={(selected) => setItem(prev => ({ ...prev, property: selected }))}
                                onOptionCreate={(option) => handleCreateOption('property', option)}
                                placeholder="Select properties..."
                                creatable
                             />
                        </div>
                        
                         <div className="space-y-2">
                             <Label htmlFor="detail">Special Effects / Details</Label>
                             <MultiSelectCombobox 
                                options={allEffects}
                                selected={item.detail || []}
                                onSelectedChange={(selected) => setItem(prev => ({ ...prev, detail: selected }))}
                                onOptionCreate={(option) => handleCreateOption('effect', option)}
                                placeholder="Select special effects..."
                                creatable
                             />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
