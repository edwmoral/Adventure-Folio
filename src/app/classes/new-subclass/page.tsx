'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Class, ClassAutolevel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STORAGE_KEY = 'dnd_classes';

export default function NewSubclassPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [baseClassNames, setBaseClassNames] = useState<string[]>([]);
  
  const [selectedBaseClass, setSelectedBaseClass] = useState('');
  const [subclassName, setSubclassName] = useState('');
  const [features, setFeatures] = useState('');

  useEffect(() => {
    try {
      const storedClasses = localStorage.getItem(STORAGE_KEY);
      if (storedClasses) {
        const parsedClasses: Class[] = JSON.parse(storedClasses);
        setAllClasses(parsedClasses);
        const uniqueNames = [...new Set(parsedClasses.map(c => c.name))];
        setBaseClassNames(uniqueNames.sort());
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load existing classes.' });
    }
  }, [toast]);
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedBaseClass || !subclassName.trim() || !features.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
      return;
    }

    try {
        const baseClass = allClasses.find(c => c.name === selectedBaseClass);
        if (!baseClass) {
             toast({ variant: 'destructive', title: 'Error', description: 'Base class not found.' });
             return;
        }
        
        const newSubclass: Class = {
            ...baseClass,
            subclass: subclassName,
            autolevel: [...baseClass.autolevel], // Deprecated, keep for now
            levels: [...baseClass.levels] // Use new structure
        };

        const subclassFeatures = features.split(',').map(f => ({ name: f.trim(), text: 'Subclass feature' }));
        const level3Index = newSubclass.levels.findIndex(l => l.level === 3);
        
        if (level3Index > -1) {
            newSubclass.levels[level3Index].feature = [
                ...(newSubclass.levels[level3Index].feature || []),
                ...subclassFeatures,
            ];
        } else {
            newSubclass.levels.push({ level: 3, feature: subclassFeatures });
            newSubclass.levels.sort((a,b) => a.level - b.level);
        }

        const updatedClasses = [...allClasses, newSubclass];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClasses));

        toast({ title: "Subclass Created!", description: "The new subclass has been added." });
        router.push(`/classes`);

    } catch (error) {
        console.error("Failed to create subclass:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new subclass." });
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
                <CardTitle>Add New Subclass</CardTitle>
                <CardDescription>
                    Add a new subclass to an existing class.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label>Base Class</Label>
                        <Select value={selectedBaseClass} onValueChange={setSelectedBaseClass}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a base class..." />
                            </SelectTrigger>
                            <SelectContent>
                                {baseClassNames.map(name => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subclassName">New Subclass Name</Label>
                        <Input id="subclassName" placeholder="e.g., Rune Knight" value={subclassName} onChange={(e) => setSubclassName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="features">Features</Label>
                        <Textarea id="features" placeholder="e.g., Bonus Proficiencies, Giant's Might (comma-separated)" value={features} onChange={(e) => setFeatures(e.target.value)} required />
                        <p className="text-sm text-muted-foreground">Note: Features are currently hardcoded to be added at level 3.</p>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!selectedBaseClass}>Add Subclass</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
