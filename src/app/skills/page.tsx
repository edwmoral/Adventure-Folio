'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Skill } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

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

export default function SkillsPage() {
    const [skills, setSkills] = useState<Skill[]>(initialSkills);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">SKILLS</h1>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Skill
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead className="w-[150px]">Ability</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {skills.map(skill => (
                    <TableRow key={skill.name}>
                        <TableCell className="font-medium">{skill.name}</TableCell>
                        <TableCell><Badge variant="outline">{skill.ability}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{skill.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
