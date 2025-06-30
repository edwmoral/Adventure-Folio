'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Class, Skill, Feat, ClassFeature, ClassAutolevel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const STORAGE_KEY_CLASSES = 'dnd_classes';
const STORAGE_KEY_SKILLS = 'dnd_skills';
const STORAGE_KEY_FEATS = 'dnd_feats';

const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].sort();
const HIT_DICE = ['d6', 'd8', 'd10', 'd12'];
const SPELLCASTING_TYPES: Array<'none' | 'prepared' | 'known'> = ['none', 'prepared', 'known'];


export default function NewClassPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [subclass, setSubclass] = useState('');
  const [hitDie, setHitDie] = useState('');
  const [primaryAbility, setPrimaryAbility] = useState('');
  const [spellcastingType, setSpellcastingType] = useState<'none' | 'prepared' | 'known'>('none');
  const [selectedSavingThrows, setSelectedSavingThrows] = useState<string[]>([]);

  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [allFeats, setAllFeats] = useState<Feat[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedSkills = localStorage.getItem(STORAGE_KEY_SKILLS);
      if (storedSkills) setAllSkills(JSON.parse(storedSkills).sort((a: Skill, b: Skill) => a.name.localeCompare(b.name)));

      const storedFeats = localStorage.getItem(STORAGE_KEY_FEATS);
      if (storedFeats) setAllFeats(JSON.parse(storedFeats).sort((a: Feat, b: Feat) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Failed to load skills/feats from localStorage", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load skills and features data.' });
    }
  }, [toast]);

  const handleSavingThrowChange = (ability: string) => {
    setSelectedSavingThrows(prev => {
        if (prev.includes(ability)) {
            return prev.filter(item => item !== ability);
        } else {
            // D&D classes typically have 2 saving throw proficiencies
            if (prev.length < 2) {
                return [...prev, ability];
            }
            toast({ variant: 'destructive', title: 'Limit Reached', description: 'You can only select up to 2 saving throws.' });
            return prev;
        }
    });
  };

  const handleSkillChange = (skillName: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillName) 
        ? prev.filter(item => item !== skillName) 
        : [...prev, skillName]
    );
  };

  const handleFeatureChange = (featureName: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureName) 
        ? prev.filter(item => item !== featureName) 
        : [...prev, featureName]
    );
  };
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !subclass || !hitDie || !primaryAbility || !spellcastingType || selectedSavingThrows.length !== 2 || selectedSkills.length === 0 || selectedFeatures.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields, select exactly 2 saving throws, and at least one skill and feature.' });
        return;
    }

    try {
        const storedClasses = localStorage.getItem(STORAGE_KEY_CLASSES);
        const classes: Class[] = storedClasses ? JSON.parse(storedClasses) : [];
        
        const newAutolevel: ClassAutolevel[] = [
          {
            level: 1,
            feature: selectedFeatures.map(f => {
                const feat = allFeats.find(feat => feat.name === f);
                return { name: f, text: feat?.text || 'No description available.' };
            })
          }
        ];

        const newClass: Class = {
            name: name,
            subclass: subclass,
            hd: parseInt(hitDie.replace('d', '')),
            hit_die: hitDie,
            primary_ability: primaryAbility,
            saving_throws: selectedSavingThrows,
            spellcasting_type: spellcastingType,
            skills: selectedSkills,
            levels: newAutolevel, // Use the new structure
            // Deprecated fields, can be removed if fully migrated
            autolevel: newAutolevel,
        };

        const updatedClasses = [...classes, newClass];
        localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(updatedClasses));

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
                    Define a new class and its first subclass.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Class Name</Label>
                            <Input id="name" placeholder="e.g., Artificer" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subclass">First Subclass Name</Label>
                            <Input id="subclass" placeholder="e.g., Alchemist" value={subclass} onChange={(e) => setSubclass(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hit_die">Hit Die</Label>
                            <Select value={hitDie} onValueChange={setHitDie}>
                                <SelectTrigger id="hit_die">
                                    <SelectValue placeholder="Select a hit die..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {HIT_DICE.map(die => <SelectItem key={die} value={die}>{die}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="primary_ability">Primary Ability</Label>
                            <Select value={primaryAbility} onValueChange={setPrimaryAbility}>
                                <SelectTrigger id="primary_ability">
                                    <SelectValue placeholder="Select a primary ability..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ABILITIES.map(ability => <SelectItem key={ability} value={ability}>{ability}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="spellcasting_type">Spellcasting Type</Label>
                            <Select value={spellcastingType} onValueChange={(val) => setSpellcastingType(val as 'none' | 'prepared' | 'known')}>
                                <SelectTrigger id="spellcasting_type">
                                    <SelectValue placeholder="Select a spellcasting type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {SPELLCASTING_TYPES.map(type => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Saving Throws (Choose 2)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md bg-transparent">
                          {ABILITIES.map(ability => (
                              <div key={ability} className="flex items-center space-x-2">
                                  <Checkbox
                                      id={`saving-throw-${ability}`}
                                      checked={selectedSavingThrows.includes(ability)}
                                      onCheckedChange={() => handleSavingThrowChange(ability)}
                                  />
                                  <Label htmlFor={`saving-throw-${ability}`} className="font-normal">{ability}</Label>
                              </div>
                          ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Skills (Choose from list)</Label>
                        <ScrollArea className="h-40 w-full rounded-md border p-4">
                            <div className="grid grid-cols-2 gap-2">
                                {allSkills.length > 0 ? allSkills.map(skill => (
                                    <div key={skill.name} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`skill-${skill.name}`}
                                            checked={selectedSkills.includes(skill.name)}
                                            onCheckedChange={() => handleSkillChange(skill.name)}
                                        />
                                        <Label htmlFor={`skill-${skill.name}`} className="font-normal">{skill.name}</Label>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground col-span-2">No skills found. Add them on the Skills page.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="space-y-2">
                        <Label>Level 1 Features (Choose from list)</Label>
                        <ScrollArea className="h-40 w-full rounded-md border p-4">
                            <div className="space-y-2">
                                {allFeats.length > 0 ? allFeats.map(feat => (
                                    <div key={feat.name} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`feat-${feat.name}`}
                                            checked={selectedFeatures.includes(feat.name)}
                                            onCheckedChange={() => handleFeatureChange(feat.name)}
                                        />
                                        <Label htmlFor={`feat-${feat.name}`} className="font-normal">{feat.name}</Label>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground">No features found. Add them on the Features page.</p>}
                            </div>
                        </ScrollArea>
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
