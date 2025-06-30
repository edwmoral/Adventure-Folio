'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Background } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = 'dnd_backgrounds';

const toArray = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

export default function NewBackgroundPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [background, setBackground] = useState({
    name: '',
    description: '',
    skill_proficiencies: '',
    tool_proficiencies: '',
    equipment: '',
    features: '',
    personality_traits: '',
    ideals: '',
    bonds: '',
    flaws: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setBackground(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!background.name || !background.description) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name and Description are required.' });
        return;
    }

    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        const allBackgrounds: Background[] = storedData ? JSON.parse(storedData) : [];
        
        const newBackground: Background = {
            name: background.name,
            description: background.description,
            skill_proficiencies: toArray(background.skill_proficiencies),
            tool_proficiencies: toArray(background.tool_proficiencies),
            equipment: toArray(background.equipment),
            features: toArray(background.features),
            personality_traits: toArray(background.personality_traits),
            ideals: toArray(background.ideals),
            bonds: toArray(background.bonds),
            flaws: toArray(background.flaws),
        };

        const updatedBackgrounds = [...allBackgrounds, newBackground];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBackgrounds));

        toast({ title: "Background Created!", description: "The new background has been added." });
        router.push(`/backgrounds`);

    } catch (error) {
        console.error("Failed to create background:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new background." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/backgrounds">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Backgrounds
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Background</CardTitle>
                <CardDescription>
                    Define a new character background. Use comma-separated values for lists.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Background Name</Label>
                        <Input id="name" value={background.name} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={background.description} onChange={handleInputChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="skill_proficiencies">Skill Proficiencies</Label>
                        <Textarea id="skill_proficiencies" value={background.skill_proficiencies} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tool_proficiencies">Tool Proficiencies</Label>
                        <Textarea id="tool_proficiencies" value={background.tool_proficiencies} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="equipment">Equipment</Label>
                        <Textarea id="equipment" value={background.equipment} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="features">Features</Label>
                        <Textarea id="features" value={background.features} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="personality_traits">Personality Traits</Label>
                        <Textarea id="personality_traits" value={background.personality_traits} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ideals">Ideals</Label>
                        <Textarea id="ideals" value={background.ideals} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bonds">Bonds</Label>
                        <Textarea id="bonds" value={background.bonds} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="flaws">Flaws</Label>
                        <Textarea id="flaws" value={background.flaws} onChange={handleInputChange} />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Create Background</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
