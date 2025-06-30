'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Background, RaceTrait } from '@/lib/types';
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
    text: '',
    proficiency: '',
    features: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setBackground(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!background.name || !background.text) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name and Description are required.' });
        return;
    }

    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        const allBackgrounds: Background[] = storedData ? JSON.parse(storedData) : [];
        
        const newBackground: Background = {
            name: background.name,
            text: background.text,
            proficiency: toArray(background.proficiency),
            trait: toArray(background.features).map(f => ({ name: f, text: 'Feature provided by background.' })),
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
                        <Label htmlFor="text">Description</Label>
                        <Textarea id="text" value={background.text} onChange={handleInputChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="proficiency">Proficiencies (Skills, Tools, etc.)</Label>
                        <Textarea id="proficiency" value={background.proficiency} onChange={handleInputChange} placeholder="e.g., Athletics, Intimidation, Gaming Set, Vehicles (Land)"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="features">Features</Label>
                        <Textarea id="features" value={background.features} onChange={handleInputChange} placeholder="e.g., Military Rank, Wanderer" />
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
