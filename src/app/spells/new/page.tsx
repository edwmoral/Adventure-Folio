'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Spell } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const STORAGE_KEY = 'dnd_spells';
const SPELL_SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

export default function NewSpellPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [spell, setSpell] = useState<Partial<Spell>>({ name: '', level: 0, school: '', casting_time: '', range: '', duration: '', components: [], classes: [] });
  const [hasMaterial, setHasMaterial] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSpell(prev => ({ ...prev, [id]: id === 'level' ? parseInt(value) : value }));
  };

  const handleSelectChange = (id: keyof Spell, value: string) => {
    setSpell(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (component: 'V' | 'S' | 'M') => {
    setSpell(prev => {
        const newComponents = prev.components?.includes(component)
            ? prev.components.filter(c => c !== component)
            : [...(prev.components || []), component];
        if (component === 'M') {
            setHasMaterial(newComponents.includes('M'));
        }
        return { ...prev, components: newComponents };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!spell.name || !spell.school || !spell.description) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name, School, and Description are required.' });
        return;
    }

    try {
        const storedSpells = localStorage.getItem(STORAGE_KEY);
        const spells: Spell[] = storedSpells ? JSON.parse(storedSpells) : [];
        
        const newSpell: Spell = {
            ...spell,
            name: spell.name,
            level: spell.level || 0,
            school: spell.school,
            casting_time: spell.casting_time || '1 action',
            range: spell.range || 'N/A',
            duration: spell.duration || 'Instantaneous',
            components: spell.components || [],
            description: spell.description,
            classes: typeof spell.classes === 'string' ? (spell.classes as string).split(',').map(s => s.trim()) : spell.classes || [],
        };

        const updatedSpells = [...spells, newSpell];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSpells));

        toast({ title: "Spell Created!", description: "The new spell has been added to the grimoire." });
        router.push(`/spells`);

    } catch (error) {
        console.error("Failed to create spell:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new spell." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/spells">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Spells
             </Link>
        </Button>
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Spell</CardTitle>
                <CardDescription>
                    Define a new spell for your world.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Spell Name</Label>
                            <Input id="name" value={spell.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level">Spell Level</Label>
                            <Input id="level" type="number" min="0" max="9" value={spell.level} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="school">School of Magic</Label>
                            <Select value={spell.school} onValueChange={(val) => handleSelectChange('school', val)}>
                                <SelectTrigger><SelectValue placeholder="Select a school..." /></SelectTrigger>
                                <SelectContent>
                                    {SPELL_SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="casting_time">Casting Time</Label>
                            <Input id="casting_time" value={spell.casting_time} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="range">Range</Label>
                            <Input id="range" value={spell.range} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input id="duration" value={spell.duration} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Components</Label>
                        <div className="flex gap-4 items-center p-2 border rounded-md">
                            <div className="flex items-center gap-2"><Checkbox id="V" checked={spell.components?.includes('V')} onCheckedChange={() => handleCheckboxChange('V')} /><Label htmlFor="V" className="font-normal">Verbal (V)</Label></div>
                            <div className="flex items-center gap-2"><Checkbox id="S" checked={spell.components?.includes('S')} onCheckedChange={() => handleCheckboxChange('S')} /><Label htmlFor="S" className="font-normal">Somatic (S)</Label></div>
                            <div className="flex items-center gap-2"><Checkbox id="M" checked={hasMaterial} onCheckedChange={() => handleCheckboxChange('M')} /><Label htmlFor="M" className="font-normal">Material (M)</Label></div>
                        </div>
                    </div>
                    {hasMaterial && (
                         <div className="space-y-2">
                            <Label htmlFor="material">Material Component</Label>
                            <Input id="material" value={spell.material} onChange={handleInputChange} placeholder="e.g., A tiny ball of bat guano and sulfur"/>
                        </div>
                    )}
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={spell.description} onChange={handleInputChange} required className="min-h-[120px]"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="classes">Classes (comma-separated)</Label>
                        <Input id="classes" value={Array.isArray(spell.classes) ? spell.classes.join(', ') : ''} onChange={handleInputChange} />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit">Create Spell</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
