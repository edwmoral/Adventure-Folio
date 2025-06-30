'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Background } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

const initialBackgrounds: Background[] = [
  {
    name: "Soldier",
    text: "You trained for war and fought in one or more conflicts. You're skilled in military tactics and combat.",
    proficiency: ["Athletics", "Intimidation", "One type of gaming set", "Vehicles (land)"],
    trait: [{ name: "Military Rank", text: "You have a military rank from your career as a soldier." }],
  }
];

const STORAGE_KEY = 'dnd_backgrounds';

export default function BackgroundsPage() {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);

  useEffect(() => {
    try {
      const storedBackgrounds = localStorage.getItem(STORAGE_KEY);
      if (storedBackgrounds) {
        setBackgrounds(JSON.parse(storedBackgrounds));
      } else {
        setBackgrounds(initialBackgrounds);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBackgrounds));
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setBackgrounds(initialBackgrounds);
    }
  }, []);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary font-headline">BACKGROUNDS</h1>
            <Button asChild>
                <Link href="/backgrounds/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Background
                </Link>
            </Button>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Proficiencies</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {backgrounds.map((background) => (
                    <TableRow key={background.name}>
                        <TableCell className="font-medium">{background.name}</TableCell>
                        <TableCell className="text-muted-foreground">{background.text}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {background.proficiency?.map(skill => (
                              <Badge key={skill} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
