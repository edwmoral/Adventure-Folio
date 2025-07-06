
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Class } from "@/lib/types";
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getGlobalCollection, deleteGlobalDoc, seedGlobalData } from '@/lib/firestore';

const initialMockClasses: Class[] = [
  {
    id: "Fighter-Champion",
    name: "Fighter",
    subclass: "Champion",
    hd: 10,
    hit_die: "d10",
    primary_ability: "Strength or Dexterity",
    saving_throws: ["Strength", "Constitution"],
    spellcasting_type: "none",
    skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    levels: [{ level: 1, feature: [{ name: "Fighting Style", text: "" }, { name: "Second Wind", text: "" }] }],
    autolevel: [{ level: 1, feature: [{ name: "Fighting Style", text: "" }, { name: "Second Wind", text: "" }] }]
  },
  {
    id: "Fighter-Battle-Master",
    name: "Fighter",
    subclass: "Battle Master",
    hd: 10,
    hit_die: "d10",
    primary_ability: "Strength or Dexterity",
    saving_throws: ["Strength", "Constitution"],
    spellcasting_type: "none",
    skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    levels: [{ level: 3, feature: [{ name: "Combat Superiority", text: "" }] }],
    autolevel: [{ level: 3, feature: [{ name: "Combat Superiority", text: "" }] }]
  },
  {
    id: "Wizard-School-of-Evocation",
    name: "Wizard",
    subclass: "School of Evocation",
    hd: 6,
    hit_die: "d6",
    primary_ability: "Intelligence",
    saving_throws: ["Intelligence", "Wisdom"],
    spellcasting_type: "prepared",
    skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    levels: [{ level: 2, feature: [{ name: "Evocation Savant", text: "" }, { name: "Sculpt Spells", text: "" }] }],
    autolevel: [{ level: 2, feature: [{ name: "Evocation Savant", text: "" }, { name: "Sculpt Spells", text: "" }] }]
  },
  {
    id: "Wizard-School-of-Abjuration",
    name: "Wizard",
    subclass: "School of Abjuration",
    hd: 6,
    hit_die: "d6",
    primary_ability: "Intelligence",
    saving_throws: ["Intelligence", "Wisdom"],
    spellcasting_type: "prepared",
    skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    levels: [{ level: 2, feature: [{ name: "Abjuration Savant", text: "" }, { name: "Arcane Ward", text: "" }] }],
    autolevel: [{ level: 2, feature: [{ name: "Abjuration Savant", text: "" }, { name: "Arcane Ward", text: "" }] }]
  },
  {
    id: "Rogue-Thief",
    name: "Rogue",
    subclass: "Thief",
    hd: 8,
    hit_die: "d8",
    primary_ability: "Dexterity",
    saving_throws: ["Dexterity", "Intelligence"],
    spellcasting_type: "none",
    skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    levels: [{ level: 1, feature: [{ name: "Expertise", text: "" }, { name: "Sneak Attack", text: "" }, { name: "Thieves' Cant", text: "" }] }],
    autolevel: [{ level: 1, feature: [{ name: "Expertise", text: "" }, { name: "Sneak Attack", text: "" }, { name: "Thieves' Cant", text: "" }] }]
  },
  {
    id: "Rogue-Assassin",
    name: "Rogue",
    subclass: "Assassin",
    hd: 8,
    hit_die: "d8",
    primary_ability: "Dexterity",
    saving_throws: ["Dexterity", "Intelligence"],
    spellcasting_type: "none",
    skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    levels: [{ level: 3, feature: [{ name: "Assassinate", text: "" }] }],
    autolevel: [{ level: 3, feature: [{ name: "Assassinate", text: "" }] }]
  },
];

// Helper to group classes by name
const groupClassesByName = (classes: Class[]) => {
  return classes.reduce((acc, currentClass) => {
    const { name } = currentClass;
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(currentClass);
    return acc;
  }, {} as Record<string, Class[]>);
};


export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            await seedGlobalData('classes', initialMockClasses, 'id');
            const data = await getGlobalCollection<Class>('classes');
            setClasses(data);
        } catch (error) {
            console.error("Failed to fetch classes:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch classes.' });
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [toast]);

  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    try {
        await deleteGlobalDoc('classes', classToDelete.id);
        setClasses(classes.filter(c => c.id !== classToDelete.id));
        toast({
          title: "Class Deleted",
          description: `"${classToDelete.name} - ${classToDelete.subclass}" has been deleted.`
        });
    } catch (error) {
        console.error("Failed to delete class:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the class." });
    } finally {
        setClassToDelete(null);
    }
  };
  
  if (loading) {
    return <div>Loading classes...</div>;
  }

  const groupedClasses = groupClassesByName(classes);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-primary font-headline">CLASSES</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/classes/new">Add Class</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/classes/new-subclass">Add Sub-class</Link>
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        {Object.entries(groupedClasses).map(([className, subclasses]) => (
          <Card key={className}>
            <CardHeader>
              <CardTitle>{className}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Subclass</TableHead>
                    <TableHead>Primary Ability</TableHead>
                    <TableHead>Hit Die</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subclasses.map((subclass) => (
                    <TableRow key={subclass.id}>
                      <TableCell className="font-medium">{subclass.subclass}</TableCell>
                      <TableCell>{subclass.primary_ability}</TableCell>
                      <TableCell>d{subclass.hd}</TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="icon">
                                <Link href={`/classes/edit?id=${encodeURIComponent(subclass.id)}`}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit {subclass.name} - {subclass.subclass}</span>
                                </Link>
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => setClassToDelete(subclass)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete {subclass.name} - {subclass.subclass}</span>
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{classToDelete?.name} - {classToDelete?.subclass}" class. This may affect characters using this class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClassToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
