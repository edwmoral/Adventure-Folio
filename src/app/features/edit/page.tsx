
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function EditFeatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const featNameParam = searchParams.get('name');
  const [isLoading, setIsLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [prerequisite, setPrerequisite] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (featNameParam) {
      try {
        const storedFeats = localStorage.getItem(STORAGE_KEY);
        if (storedFeats) {
          const feats: Feat[] = JSON.parse(storedFeats);
          const foundFeat = feats.find(f => f.name === featNameParam);
          if (foundFeat) {
            setName(foundFeat.name);
            setPrerequisite(foundFeat.prerequisite || '');
            setText(foundFeat.text);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Feat not found.' });
            router.push('/features');
          }
        }
      } catch (error) {
        console.error("Failed to load feat from localStorage", error);
        toast({ variant: "destructive", title: "Load Failed", description: "Could not load feat data." });
      }
    }
    setIsLoading(false);
  }, [featNameParam, router, toast]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !text) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name and description are required.' });
        return;
    }

    try {
        const storedFeats = localStorage.getItem(STORAGE_KEY);
        const feats: Feat[] = storedFeats ? JSON.parse(storedFeats) : [];
        
        const updatedFeat: Feat = {
            name,
            text,
            prerequisite: prerequisite || undefined,
        };

        const updatedFeats = feats.map(f => f.name === featNameParam ? updatedFeat : f);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFeats));

        toast({ title: "Feat Updated!", description: "The feat has been successfully updated." });
        router.push(`/features`);

    } catch (error) {
        console.error("Failed to update feat:", error);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the feat." });
    }
  }

  if (isLoading) {
    return <div className="text-center p-8">Loading feat data...</div>;
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
                <CardTitle>Edit Feat</CardTitle>
                <CardDescription>
                    Update the details for "{name}".
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
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
