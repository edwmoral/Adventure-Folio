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

const STORAGE_KEY = 'dnd_classes';

export default function NewClassPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    subclass: '',
    hit_die: '',
    primary_ability: '',
    saving_throws: '',
    skills: '',
    features: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Basic validation
    for (const key in formData) {
      if (formData[key as keyof typeof formData].trim() === '') {
          toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
          return;
      }
    }

    try {
        const storedClasses = localStorage.getItem(STORAGE_KEY);
        const classes: Class[] = storedClasses ? JSON.parse(storedClasses) : [];
        
        const newClass: Class = {
            name: formData.name,
            subclass: formData.subclass,
            hit_die: formData.hit_die,
            primary_ability: formData.primary_ability,
            saving_throws: formData.saving_throws.split(',').map(s => s.trim()),
            skills: formData.skills.split(',').map(s => s.trim()),
            levels: [{ level: 1, features: formData.features.split(',').map(f => f.trim()) }]
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
                            <Input id="name" placeholder="e.g., Artificer" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subclass">First Subclass Name</Label>
                            <Input id="subclass" placeholder="e.g., Alchemist" value={formData.subclass} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hit_die">Hit Die</Label>
                            <Input id="hit_die" placeholder="e.g., d8" value={formData.hit_die} onChange={handleChange} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="primary_ability">Primary Ability</Label>
                            <Input id="primary_ability" placeholder="e.g., Intelligence" value={formData.primary_ability} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="saving_throws">Saving Throws</Label>
                        <Input id="saving_throws" placeholder="e.g., Constitution, Intelligence" value={formData.saving_throws} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="skills">Skills</Label>
                        <Textarea id="skills" placeholder="e.g., Arcana, Investigation, Medicine" value={formData.skills} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="features">Level 1 Features</Label>
                        <Textarea id="features" placeholder="e.g., Magical Tinkering, Spellcasting" value={formData.features} onChange={handleChange} required />
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
