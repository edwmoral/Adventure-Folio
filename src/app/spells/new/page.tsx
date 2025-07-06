
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Spell, Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectCombobox } from "@/components/multi-select-combobox";
import { getGlobalCollection, saveGlobalDoc } from "@/lib/firestore";

const SPELL_SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'].sort();
const CASTING_TIME_UNITS = ['Action', 'Bonus Action', 'Reaction', 'Minute', 'Hour'];
const RANGE_UNITS = ['Self', 'Touch', 'Feet', 'Mile', 'Special'];
const DURATION_UNITS = ['Instantaneous', 'Round', 'Minute', 'Hour', 'Day', 'Special', 'Until Dispelled'];
const AOE_SHAPES = ['Sphere', 'Cube', 'Cone', 'Line', 'Cylinder'];

export default function NewSpellPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [spell, setSpell] = useState<Partial<Spell> & { material_component?: string }>({ name: '', level: 0, school: '', ritual: false, text: '', classes: '' });
  const [hasVerbal, setHasVerbal] = useState(false);
  const [hasSomatic, setHasSomatic] = useState(false);
  const [hasMaterial, setHasMaterial] = useState(false);

  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // State for structured inputs
  const [castingTimeNumber, setCastingTimeNumber] = useState(1);
  const [castingTimeUnit, setCastingTimeUnit] = useState('Action');

  const [rangeNumber, setRangeNumber] = useState(30);
  const [rangeUnit, setRangeUnit] = useState('Feet');

  const [isConcentration, setIsConcentration] = useState(false);
  const [durationUnit, setDurationUnit] = useState('Instantaneous');
  const [durationNumber, setDurationNumber] = useState(1);

  const [hasAoe, setHasAoe] = useState(false);
  const [aoeShape, setAoeShape] = useState('Sphere');
  const [aoeSize, setAoeSize] = useState(20);

  useEffect(() => {
    async function fetchClasses() {
        try {
            const fetchedClasses = await getGlobalCollection<Class>('classes');
            const uniqueClassNames = [...new Set(fetchedClasses.map(c => c.name))];
            setAllClasses(uniqueClassNames.sort());
        } catch (error) {
            console.error("Failed to load classes from Firestore", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load class data.' });
        }
    }
    fetchClasses();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSpell(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: keyof Spell, value: string) => {
    setSpell(prev => ({ ...prev, [id]: id === 'level' ? parseInt(value) : value }));
  };
  
  const handleCheckboxChange = (id: 'ritual' | 'V' | 'S' | 'M', checked: boolean) => {
      switch (id) {
          case 'V': setHasVerbal(checked); break;
          case 'S': setHasSomatic(checked); break;
          case 'M': setHasMaterial(checked); break;
          case 'ritual': setSpell(p => ({...p, ritual: checked})); break;
      }
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!spell.name || !spell.school || !spell.text) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name, School, and Description are required.' });
        return;
    }

    try {
        let components_list = [];
        if (hasVerbal) components_list.push('V');
        if (hasSomatic) components_list.push('S');
        if (hasMaterial) {
            let material_string = 'M';
            if (spell.material_component) {
                material_string += ` (${spell.material_component})`;
            }
            components_list.push(material_string);
        }
        
        let castingTimeString = `${castingTimeNumber} ${castingTimeUnit.toLowerCase()}`;
        if (castingTimeNumber !== 1 && castingTimeUnit !== 'Action' && castingTimeUnit !== 'Reaction' && castingTimeUnit !== 'Bonus Action') {
            castingTimeString += 's';
        }

        let rangeString = rangeUnit;
        if (['Feet', 'Mile'].includes(rangeUnit)) {
            rangeString = `${rangeNumber} ${rangeUnit.toLowerCase()}`;
            if (rangeNumber !== 1 && rangeUnit === 'Mile') rangeString += 's';
        }
        
        let durationString = isConcentration ? 'Concentration, up to ' : '';
        if (['Round', 'Minute', 'Hour', 'Day'].includes(durationUnit)) {
            durationString += `${durationNumber} ${durationUnit.toLowerCase()}${durationNumber !== 1 ? 's' : ''}`;
        } else {
            durationString += durationUnit;
        }

        const newSpell: Spell = {
            name: spell.name!,
            level: spell.level || 0,
            school: spell.school!,
            time: castingTimeString.trim(),
            range: rangeString.trim(),
            duration: durationString.trim(),
            components: components_list.join(', '),
            text: spell.text!,
            classes: selectedClasses.join(', '),
            ritual: spell.ritual || false,
        };

        if (hasAoe && aoeSize > 0) {
            newSpell.aoe = {
                shape: aoeShape.toLowerCase(),
                size: aoeSize,
            };
        }

        await saveGlobalDoc('spells', newSpell.name, newSpell);

        toast({ title: "Spell Created!", description: "The new spell has been added to the grimoire." });
        router.push(`/spells`);

    } catch (error) {
        console.error("Failed to create spell:", error);
        toast({ variant: "destructive", title: "Creation Failed", description: "Could not create the new spell." });
    }
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/spells">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Spells
             </Link>
        </Button>
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Create New Spell</CardTitle>
                <CardDescription>
                    Define a new spell for your world.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Spell Name</Label>
                            <Input id="name" value={spell.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level">Spell Level</Label>
                            <Select value={String(spell.level)} onValueChange={(val) => handleSelectChange('level', val)}>
                                <SelectTrigger id="level"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Cantrip (0)</SelectItem>
                                    {[...Array(9)].map((_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="school">School of Magic</Label>
                            <Select value={spell.school} onValueChange={(val) => handleSelectChange('school', val)}>
                                <SelectTrigger><SelectValue placeholder="Select a school..." /></SelectTrigger>
                                <SelectContent>
                                    {SPELL_SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Casting Time</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label htmlFor="casting-time-number">Value</Label>
                                <Input
                                    id="casting-time-number"
                                    type="number"
                                    value={castingTimeNumber}
                                    onChange={(e) => setCastingTimeNumber(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="casting-time-unit">Unit</Label>
                                <Select value={castingTimeUnit} onValueChange={setCastingTimeUnit}>
                                    <SelectTrigger id="casting-time-unit"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CASTING_TIME_UNITS.map(unit => (
                                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                     <div className="space-y-2">
                        <Label>Range</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                             <div className="space-y-2">
                                <Label htmlFor="range-unit">Unit</Label>
                                <Select value={rangeUnit} onValueChange={setRangeUnit}>
                                    <SelectTrigger id="range-unit"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {RANGE_UNITS.map(unit => (
                                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="range-number">Value</Label>
                                <Input
                                    id="range-number"
                                    type="number"
                                    value={rangeNumber}
                                    onChange={(e) => setRangeNumber(parseInt(e.target.value) || 1)}
                                    disabled={!['Feet', 'Mile'].includes(rangeUnit)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                            <div className="flex items-center gap-2 md:col-span-2">
                                <Checkbox
                                    id="concentration"
                                    checked={isConcentration}
                                    onCheckedChange={(checked) => setIsConcentration(!!checked)}
                                />
                                <Label htmlFor="concentration" className="font-normal">Concentration</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration-unit">Unit</Label>
                                <Select value={durationUnit} onValueChange={setDurationUnit}>
                                    <SelectTrigger id="duration-unit"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DURATION_UNITS.map(unit => (
                                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration-number">Value</Label>
                                <Input
                                    id="duration-number"
                                    type="number"
                                    value={durationNumber}
                                    onChange={(e) => setDurationNumber(parseInt(e.target.value) || 1)}
                                    disabled={!['Round', 'Minute', 'Hour', 'Day'].includes(durationUnit)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Area of Effect</Label>
                        <div className="p-4 border rounded-md space-y-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="hasAoe"
                                    checked={hasAoe}
                                    onCheckedChange={(checked) => setHasAoe(!!checked)}
                                />
                                <Label htmlFor="hasAoe" className="font-normal">This spell has an area of effect</Label>
                            </div>
                            {hasAoe && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="aoe-shape">Shape</Label>
                                        <Select value={aoeShape} onValueChange={setAoeShape}>
                                            <SelectTrigger id="aoe-shape"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {AOE_SHAPES.map(shape => (
                                                    <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="aoe-size">Size (feet)</Label>
                                        <Input
                                            id="aoe-size"
                                            type="number"
                                            value={aoeSize}
                                            onChange={(e) => setAoeSize(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Components</Label>
                        <div className="flex flex-wrap gap-4 items-center p-2 border rounded-md">
                            <div className="flex items-center gap-2"><Checkbox id="V" checked={hasVerbal} onCheckedChange={(checked) => handleCheckboxChange('V', !!checked)} /><Label htmlFor="V" className="font-normal">Verbal (V)</Label></div>
                            <div className="flex items-center gap-2"><Checkbox id="S" checked={hasSomatic} onCheckedChange={(checked) => handleCheckboxChange('S', !!checked)} /><Label htmlFor="S" className="font-normal">Somatic (S)</Label></div>
                            <div className="flex items-center gap-2"><Checkbox id="M" checked={hasMaterial} onCheckedChange={(checked) => handleCheckboxChange('M', !!checked)} /><Label htmlFor="M" className="font-normal">Material (M)</Label></div>
                            <div className="flex items-center gap-2"><Checkbox id="ritual" checked={spell.ritual} onCheckedChange={(checked) => handleCheckboxChange('ritual', !!checked)} /><Label htmlFor="ritual" className="font-normal">Ritual</Label></div>
                        </div>
                    </div>
                    {hasMaterial && (
                         <div className="space-y-2">
                            <Label htmlFor="material_component">Material Component</Label>
                            <Input id="material_component" value={spell.material_component} onChange={handleInputChange} placeholder="e.g., A tiny ball of bat guano and sulfur"/>
                        </div>
                    )}
                     <div className="space-y-2">
                        <Label htmlFor="text">Description</Label>
                        <Textarea id="text" value={spell.text} onChange={handleInputChange} required className="min-h-[120px]"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="classes">Classes</Label>
                        <MultiSelectCombobox 
                            options={allClasses}
                            selected={selectedClasses}
                            onSelectedChange={setSelectedClasses}
                            placeholder="Select classes..."
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit">Create Spell</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
