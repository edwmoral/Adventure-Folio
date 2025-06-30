'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const STORAGE_KEY = 'dnd_classes';
const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
const HIT_DICE = ['d6', 'd8', 'd10', 'd12'];
const SKILL_LIST = "Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, Sleight of Hand, Stealth, Survival";


export default function NewClassPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [subclass, setSubclass] = useState('');
  const [hitDie, setHitDie] = useState('');
  const [primaryAbility, setPrimaryAbility] = useState('');
  const [selectedSavingThrows, setSelectedSavingThrows] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [features, setFeatures] = useState('');

  const handleSavingThrowChange = (ability: string) => {
    setSelectedSavingThrows(prev => {
        if (prev.includes(ability)) {
            return prev.filter(item => item !== ability);
        } else {
            // D&D classes typically have 2 saving throw proficiencies
            if (prev.length < 2) {
                return [...prev, ability];
            }
            toast({ variant: 'destructive', title: 'Limit Reached', description: 'You can only select up to 2 saving throws.' });
            return prev;
        }
    });
  };
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !subclass || !hitDie || !primaryAbility || selectedSavingThrows.length !== 2 || !skills.trim() || !features.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields and select exactly 2 saving throws.' });
        return;
    }

    try {
        const storedClasses = localStorage.getItem(STORAGE_KEY);
        const classes: Class[] = storedClasses ? JSON.parse(storedClasses) : [];
        
        const newClass: Class = {
            name: name,
            subclass: subclass,
            hit_die: hitDie,
            primary_ability: primaryAbility,
            saving_throws: selectedSavingThrows,
            skills: skills.split(',').map(s => s.trim()),
            levels: [{ level: 1, features: features.split(',').map(f => f.trim()) }]
        };

        const updatedClasses = [...classes, newClass];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClasses));

        toast({ title: "Class Created!", description: "The new class has been added." });
        router.push(`/classes`);

    } catch (error) {
        console.error("Failed to create class:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new class." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href={`/classes`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Classes
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Class</CardTitle>
                <CardDescription>
                    Define a new class and its first subclass. Use comma-separated values for lists.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Class Name</Label>
                            <Input id="name" placeholder="e.g., Artificer" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subclass">First Subclass Name</Label>
                            <Input id="subclass" placeholder="e.g., Alchemist" value={subclass} onChange={(e) => setSubclass(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hit_die">Hit Die</Label>
                            <Select value={hitDie} onValueChange={setHitDie}>
                                <SelectTrigger id="hit_die">
                                    <SelectValue placeholder="Select a hit die..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {HIT_DICE.map(die => <SelectItem key={die} value={die}>{die}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="primary_ability">Primary Ability</Label>
                            <Select value={primaryAbility} onValueChange={setPrimaryAbility}>
                                <SelectTrigger id="primary_ability">
                                    <SelectValue placeholder="Select a primary ability..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ABILITIES.map(ability => <SelectItem key={ability} value={ability}>{ability}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Saving Throws (Choose 2)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md bg-transparent">
                          {ABILITIES.map(ability => (
                              <div key={ability} className="flex items-center space-x-2">
                                  <Checkbox
                                      id={`saving-throw-${ability}`}
                                      checked={selectedSavingThrows.includes(ability)}
                                      onCheckedChange={() => handleSavingThrowChange(ability)}
                                  />
                                  <Label htmlFor={`saving-throw-${ability}`} className="font-normal">{ability}</Label>
                              </div>
                          ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="skills">Skills (comma-separated)</Label>
                        <Textarea id="skills" placeholder="e.g., Arcana, Investigation, Medicine" value={skills} onChange={(e) => setSkills(e.target.value)} required />
                        <p className="text-sm text-muted-foreground">
                            <strong>Available:</strong> {SKILL_LIST}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="features">Level 1 Features (comma-separated)</Label>
                        <Textarea id="features" placeholder="e.g., Magical Tinkering, Spellcasting" value={features} onChange={(e) => setFeatures(e.target.value)} required />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Create Class</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
