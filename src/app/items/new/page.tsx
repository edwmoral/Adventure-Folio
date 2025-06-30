'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Item } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STORAGE_KEY_ITEMS = 'dnd_items';
const STORAGE_KEY_PROPERTIES = 'dnd_item_properties';
const STORAGE_KEY_EFFECTS = 'dnd_item_effects';

const ITEM_TYPES = ['Weapon', 'Armor', 'Consumable', 'Wondrous Item', 'Mundane'];
const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Thunder', 'Poison', 'Acid', 'Psychic', 'Necrotic', 'Radiant', 'Force'];
const DEFAULT_PROPERTIES = ['Finesse', 'Light', 'Heavy', 'Two-Handed', 'Versatile', 'Thrown', 'Ammunition', 'Loading', 'Reach'];
const DEFAULT_EFFECTS = ['Grants Advantage', 'Grants Disadvantage', 'Resistance', 'Vulnerability', '+1 Bonus'];

interface MultiSelectComboboxProps {
    options: string[];
    selected: string[];
    onSelectedChange: (selected: string[]) => void;
    onOptionCreate: (option: string) => void;
    placeholder: string;
}

const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({
    options,
    selected,
    onSelectedChange,
    onOptionCreate,
    placeholder
}) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const handleSelect = (option: string) => {
        onSelectedChange([...selected, option]);
        setInputValue("");
        setOpen(false);
    };

    const handleCreate = () => {
        if (inputValue.trim() && !options.includes(inputValue) && !selected.includes(inputValue)) {
            onOptionCreate(inputValue);
            onSelectedChange([...selected, inputValue]);
        }
        setInputValue("");
        setOpen(false);
    };

    const handleUnselect = (option: string) => {
        onSelectedChange(selected.filter(s => s !== option));
    };
    
    const filteredOptions = options.filter(option => !selected.includes(option));

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-10">
                        <div className="flex flex-wrap gap-1">
                            {selected.length > 0 
                                ? selected.map(val => (
                                    <Badge key={val} variant="secondary" className="mr-1">
                                        {val}
                                        <button onClick={(e) => { e.stopPropagation(); handleUnselect(val); }} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                                : placeholder}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search or create..."
                            value={inputValue}
                            onValueChange={setInputValue}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate();
                            }}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <Button variant="ghost" className="w-full justify-start" onClick={handleCreate}>
                                    Create "{inputValue}"
                                </Button>
                            </CommandEmpty>
                            <CommandGroup>
                                {filteredOptions.map((option) => (
                                    <CommandItem key={option} onSelect={() => handleSelect(option)}>
                                        {option}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default function NewItemPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [item, setItem] = useState<Partial<Item>>({ name: '', type: 'Mundane', weight: 0, text: '', magic: false, property: [], detail: [] });
    const [allProperties, setAllProperties] = useState<string[]>(DEFAULT_PROPERTIES);
    const [allEffects, setAllEffects] = useState<string[]>(DEFAULT_EFFECTS);

    useEffect(() => {
        try {
            const storedProps = localStorage.getItem(STORAGE_KEY_PROPERTIES);
            if (storedProps) setAllProperties(JSON.parse(storedProps));
            
            const storedEffects = localStorage.getItem(STORAGE_KEY_EFFECTS);
            if (storedEffects) setAllEffects(JSON.parse(storedEffects));
        } catch (e) {
            console.error("Failed to load item metadata from localStorage", e);
        }
    }, []);

    const handleCreateOption = (type: 'property' | 'effect', value: string) => {
        try {
            if (type === 'property') {
                const newProperties = [...allProperties, value];
                setAllProperties(newProperties);
                localStorage.setItem(STORAGE_KEY_PROPERTIES, JSON.stringify(newProperties));
            } else {
                const newEffects = [...allEffects, value];
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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!item.name || !item.type) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name and Type are required.' });
            return;
        }

        try {
            const storedItems = localStorage.getItem(STORAGE_KEY_ITEMS);
            const items: Item[] = storedItems ? JSON.parse(storedItems) : [];
            
            const newItem: Item = {
                id: `item-${Date.now()}`,
                name: item.name!,
                type: item.type,
                weight: Number(item.weight) || 0,
                property: item.property || [],
                detail: item.detail || [],
                text: item.text || '',
                magic: item.magic,
                dmg1: item.dmg1,
                dmgType: item.dmgType,
            };

            const updatedItems = [...items, newItem];
            localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updatedItems));

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
                             />
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
