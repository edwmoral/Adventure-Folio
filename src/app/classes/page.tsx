'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Class } from "@/lib/types";

const initialMockClasses: Class[] = [
  {
    name: "Fighter",
    subclass: "Champion",
    hit_die: "d10",
    primary_ability: "Strength or Dexterity",
    saving_throws: ["Strength", "Constitution"],
    spellcasting_type: "none",
    skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    levels: [{ level: 1, features: ["Fighting Style", "Second Wind"] }]
  },
  {
    name: "Fighter",
    subclass: "Battle Master",
    hit_die: "d10",
    primary_ability: "Strength or Dexterity",
    saving_throws: ["Strength", "Constitution"],
    spellcasting_type: "none",
    skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    levels: [{ level: 3, features: ["Combat Superiority"] }]
  },
  {
    name: "Wizard",
    subclass: "School of Evocation",
    hit_die: "d6",
    primary_ability: "Intelligence",
    saving_throws: ["Intelligence", "Wisdom"],
    spellcasting_type: "prepared",
    skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    levels: [{ level: 2, features: ["Evocation Savant", "Sculpt Spells"] }]
  },
  {
    name: "Wizard",
    subclass: "School of Abjuration",
    hit_die: "d6",
    primary_ability: "Intelligence",
    saving_throws: ["Intelligence", "Wisdom"],
    spellcasting_type: "prepared",
    skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    levels: [{ level: 2, features: ["Abjuration Savant", "Arcane Ward"] }]
  },
  {
    name: "Rogue",
    subclass: "Thief",
    hit_die: "d8",
    primary_ability: "Dexterity",
    saving_throws: ["Dexterity", "Intelligence"],
    spellcasting_type: "none",
    skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    levels: [{ level: 1, features: ["Expertise", "Sneak Attack", "Thieves' Cant"] }]
  },
  {
    name: "Rogue",
    subclass: "Assassin",
    hit_die: "d8",
    primary_ability: "Dexterity",
    saving_throws: ["Dexterity", "Intelligence"],
    spellcasting_type: "none",
    skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    levels: [{ level: 3, features: ["Assassinate"] }]
  },
];

const STORAGE_KEY = 'dnd_classes';

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

  useEffect(() => {
    try {
      const storedClasses = localStorage.getItem(STORAGE_KEY);
      if (storedClasses) {
        setClasses(JSON.parse(storedClasses));
      } else {
        setClasses(initialMockClasses);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockClasses));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setClasses(initialMockClasses);
    }
  }, []);

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subclasses.map((subclass) => (
                    <TableRow key={subclass.subclass}>
                      <TableCell className="font-medium">{subclass.subclass}</TableCell>
                      <TableCell>{subclass.primary_ability}</TableCell>
                      <TableCell>{subclass.hit_die}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
