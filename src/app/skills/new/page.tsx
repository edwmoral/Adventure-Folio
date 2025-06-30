'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Skill } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STORAGE_KEY = 'dnd_skills';
const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].sort();

export default function NewSkillPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [ability, setAbility] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !ability || !description) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
        return;
    }

    try {
        const storedSkills = localStorage.getItem(STORAGE_KEY);
        const skills: Skill[] = storedSkills ? JSON.parse(storedSkills) : [];
        
        const newSkill: Skill = { name, ability, description };

        const updatedSkills = [...skills, newSkill];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSkills));

        toast({ title: "Skill Created!", description: "The new skill has been added." });
        router.push(`/skills`);

    } catch (error) {
        console.error("Failed to create skill:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new skill." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/skills">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Skills
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Skill</CardTitle>
                <CardDescription>
                    Define a new skill for your world.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Skill Name</Label>
                            <Input id="name" placeholder="e.g., Survival" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ability">Associated Ability</Label>
                            <Select value={ability} onValueChange={setAbility}>
                                <SelectTrigger id="ability">
                                    <SelectValue placeholder="Select an ability..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ABILITIES.map(ab => <SelectItem key={ab} value={ab}>{ab}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="e.g., Follow tracks, hunt wild game..." value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Create Skill</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
