
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
const fromArray = (arr: string[] | undefined) => (arr || []).join(', ');

export default function EditBackgroundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const backgroundNameParam = searchParams.get('name');
  const [isLoading, setIsLoading] = useState(true);
  
  const [background, setBackground] = useState({
    name: '',
    text: '',
    proficiency: '',
    features: '',
  });

  useEffect(() => {
    if (backgroundNameParam) {
      try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        const allBackgrounds: Background[] = storedData ? JSON.parse(storedData) : [];
        const foundBackground = allBackgrounds.find(b => b.name === backgroundNameParam);
        if (foundBackground) {
          setBackground({
            name: foundBackground.name,
            text: foundBackground.text,
            proficiency: fromArray(foundBackground.proficiency),
            features: fromArray(foundBackground.trait?.map(t => t.name)),
          });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Background not found.' });
          router.push('/backgrounds');
        }
      } catch (error) {
        console.error("Failed to load background from localStorage", error);
        toast({ variant: "destructive", title: "Load Failed", description: "Could not load background data." });
      }
    }
    setIsLoading(false);
  }, [backgroundNameParam, router, toast]);

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
        
        const updatedBackground: Background = {
            name: background.name,
            text: background.text,
            proficiency: toArray(background.proficiency),
            trait: toArray(background.features).map(f => ({ name: f, text: 'Feature provided by background.' })),
        };

        const updatedBackgrounds = allBackgrounds.map(b => b.name === backgroundNameParam ? updatedBackground : b);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBackgrounds));

        toast({ title: "Background Updated!", description: "The background has been successfully updated." });
        router.push(`/backgrounds`);

    } catch (error) {
        console.error("Failed to update background:", error);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the background." });
    }
  }

  if (isLoading) {
    return <div className="text-center p-8">Loading background data...</div>;
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
                <CardTitle>Edit Background</CardTitle>
                <CardDescription>
                    Update the details for "{background.name}". Use comma-separated values for lists.
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
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
