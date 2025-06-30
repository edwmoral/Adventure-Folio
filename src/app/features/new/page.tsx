'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Feat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = 'dnd_feats';

export default function NewFeatPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [prerequisite, setPrerequisite] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !text) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name and description are required.' });
        return;
    }

    try {
        const storedFeats = localStorage.getItem(STORAGE_KEY);
        const feats: Feat[] = storedFeats ? JSON.parse(storedFeats) : [];
        
        const newFeat: Feat = {
            name,
            text,
            prerequisite: prerequisite || undefined,
        };

        const updatedFeats = [...feats, newFeat];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFeats));

        toast({ title: "Feat Created!", description: "The new feat has been added." });
        router.push(`/features`);

    } catch (error) {
        console.error("Failed to create feat:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new feat." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/features">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Feats
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Feat</CardTitle>
                <CardDescription>
                    Define a new feat.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Feat Name</Label>
                        <Input id="name" placeholder="e.g., War Caster" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prerequisite">Prerequisites</Label>
                        <Input id="prerequisite" placeholder="e.g., Spellcasting ability" value={prerequisite} onChange={(e) => setPrerequisite(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="text">Description</Label>
                        <Textarea id="text" placeholder="Describe what the feat does." value={text} onChange={(e) => setText(e.target.value)} required />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Create Feat</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
