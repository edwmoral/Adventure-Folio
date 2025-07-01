
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Skill } from '@/lib/types';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const initialSkills: Skill[] = [
  {
    name: "Athletics",
    ability: "Strength",
    description: "Covers climbing, jumping, and swimming. Often used for physical feats requiring brute force."
  },
  {
    name: "Acrobatics",
    ability: "Dexterity",
    description: "Your ability to stay on your feet in a tricky situation, such as when you're trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship's deck."
  },
  {
    name: "Arcana",
    ability: "Intelligence",
    description: "Your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes."
  },
  {
    name: "Deception",
    ability: "Charisma",
    description: "Your ability to convincingly hide the truth, either verbally or through your actions. This can encompass everything from misleading others through ambiguity to telling outright lies."
  },
  {
    name: "Insight",
    ability: "Wisdom",
    description: "Your ability to determine the true intentions of a creature, such as when searching out a lie or predicting someone's next move."
  }
];

const STORAGE_KEY = 'dnd_skills';

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSkills = localStorage.getItem(STORAGE_KEY);
      if (storedSkills) {
        setSkills(JSON.parse(storedSkills));
      } else {
        setSkills(initialSkills);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSkills));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setSkills(initialSkills);
    }
  }, []);

  const handleDeleteSkill = () => {
    if (!skillToDelete) return;
    try {
        const updatedSkills = skills.filter(s => s.name !== skillToDelete.name);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSkills));
        setSkills(updatedSkills);
        toast({ title: "Skill Deleted", description: `"${skillToDelete.name}" has been deleted.` });
        setSkillToDelete(null);
    } catch (error) {
        console.error("Failed to delete skill:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the skill." });
    }
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">SKILLS</h1>
            <Button asChild>
                <Link href="/skills/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Skill
                </Link>
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead className="w-[150px]">Ability</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {skills.map(skill => (
                    <TableRow key={skill.name}>
                        <TableCell className="font-medium">{skill.name}</TableCell>
                        <TableCell><Badge variant="outline">{skill.ability}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{skill.description}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="icon">
                                  <Link href={`/skills/edit?name=${encodeURIComponent(skill.name)}`}>
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit {skill.name}</span>
                                  </Link>
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => setSkillToDelete(skill)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete {skill.name}</span>
                              </Button>
                           </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
        <AlertDialog open={!!skillToDelete} onOpenChange={(open) => !open && setSkillToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{skillToDelete?.name}" skill.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSkillToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSkill} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
