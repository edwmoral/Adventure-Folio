
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateBackgroundAction, generatePortraitAction } from '@/app/character/create/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, User, Trash2, Dices } from 'lucide-react';
import type { Class, PlayerCharacter } from '@/lib/types';
import { fullCasterSpellSlots } from '@/lib/dnd-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MultiSelectCombobox } from './multi-select-combobox';

const STORAGE_KEY_CLASSES = 'dnd_classes';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';
const STORAGE_KEY_LAST_ACTIVE_CHARACTER = 'dnd_last_active_character_id';
const STORAGE_KEY_GENDERS = 'dnd_genders';
const ARMOR_PREFERENCES = ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Robes', 'Leather', 'Unarmored'].sort();

const characterFormSchema = z.object({
  characterName: z.string().min(2, {
    message: 'Character name must be at least 2 characters.',
  }),
  characterRace: z.string({
    required_error: 'Please select a race.',
  }),
  characterClass: z.string({
    required_error: 'Please select a class.',
  }),
  gender: z.string().min(1, { message: 'Gender is required.' }),
  armorPreference: z.array(z.string()).min(1, { message: 'Please select at least one armor preference.' }),
  colorPreference: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Please select a valid color.' }),
  avatar: z.string().optional(),
  backgroundStory: z.string().optional(),
  desiredTone: z.string().optional(),
  additionalDetails: z.string().optional(),
  stats: z.object({
      str: z.coerce.number().min(1).max(20),
      dex: z.coerce.number().min(1).max(20),
      con: z.coerce.number().min(1).max(20),
      int: z.coerce.number().min(1).max(20),
      wis: z.coerce.number().min(1).max(20),
      cha: z.coerce.number().min(1).max(20),
  }),
});

const RACES = ['Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Halfling', 'Human'].sort();

export function CharacterCreationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isGeneratingBackground, startBackgroundTransition] = useTransition();
  const [isGeneratingPortrait, startPortraitTransition] = useTransition();
  const [classes, setClasses] = useState<Class[]>([]);
  const [genderOptions, setGenderOptions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedClasses = localStorage.getItem(STORAGE_KEY_CLASSES);
      if (storedClasses) {
        const parsedClasses: Class[] = JSON.parse(storedClasses);
        parsedClasses.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          if (a.subclass < b.subclass) return -1;
          if (a.subclass > b.subclass) return 1;
          return 0;
        });
        setClasses(parsedClasses);
      }
      const storedGenders = localStorage.getItem(STORAGE_KEY_GENDERS);
        if (storedGenders) {
            setGenderOptions(JSON.parse(storedGenders));
        } else {
            setGenderOptions(['Male', 'Female', 'Non-binary']);
        }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load class or gender data.' });
    }
  }, [toast]);

  const form = useForm<z.infer<typeof characterFormSchema>>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      characterName: '',
      backgroundStory: '',
      desiredTone: '',
      additionalDetails: '',
      avatar: '',
      gender: '',
      armorPreference: [],
      colorPreference: '#4A6572',
      stats: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
    },
  });

  const avatarUrl = form.watch('avatar');
  const watchedAiFields = form.watch(['characterName', 'characterRace', 'characterClass', 'gender', 'armorPreference', 'colorPreference']);
  const isAiGenDisabled = isGeneratingBackground || isGeneratingPortrait || !watchedAiFields[0] || !watchedAiFields[1] || !watchedAiFields[2] || !watchedAiFields[3] || !watchedAiFields[4] || watchedAiFields[4].length === 0 || !watchedAiFields[5];


  const handleGenerateBackground = () => {
    startBackgroundTransition(async () => {
      const values = form.getValues();
      const [className] = (values.characterClass || ':').split(':');

      const result = await generateBackgroundAction({
        characterName: values.characterName,
        characterRace: values.characterRace,
        characterClass: className,
        gender: values.gender,
        armorPreference: values.armorPreference,
        colorPreference: values.colorPreference,
        desiredTone: values.desiredTone,
        additionalDetails: values.additionalDetails,
      });

      if (result.success) {
        form.setValue('backgroundStory', result.background || '');
        toast({
          title: 'Background Generated!',
          description: "Your character's story has been written.",
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: result.error,
        });
      }
    });
  };
  
  const handleGeneratePortrait = () => {
    const backstory = form.getValues('backgroundStory');
    if (!backstory) {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'Please generate or write a background story first to provide context for the portrait.',
        });
        return;
    }

    startPortraitTransition(async () => {
      const values = form.getValues();
      const [className] = (values.characterClass || ':').split(':');
      
      const result = await generatePortraitAction({
        characterRace: values.characterRace,
        characterClass: className,
        gender: values.gender,
        armorPreference: values.armorPreference,
        colorPreference: values.colorPreference,
        characterDescription: values.backgroundStory || '',
      });

      if (result.success && result.imageUrl) {
        form.setValue('avatar', result.imageUrl);
        toast({
          title: 'Portrait Generated!',
          description: "Your character's portrait is ready.",
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: result.error,
        });
      }
    });
  };

  const rollStat = () => {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    rolls.shift(); // drop the lowest
    return rolls.reduce((sum, roll) => sum + roll, 0);
  };

  const handleRollStats = () => {
    form.setValue('stats.str', rollStat());
    form.setValue('stats.dex', rollStat());
    form.setValue('stats.con', rollStat());
    form.setValue('stats.int', rollStat());
    form.setValue('stats.wis', rollStat());
    form.setValue('stats.cha', rollStat());
    toast({ title: "Stats Rolled!", description: "Your ability scores have been generated." });
  };


  function onSubmit(values: z.infer<typeof characterFormSchema>) {
    try {
        const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
        const playerCharacters: PlayerCharacter[] = storedCharacters ? JSON.parse(storedCharacters) : [];
        
        if (!genderOptions.includes(values.gender)) {
            const newGenders = [...genderOptions, values.gender].sort();
            setGenderOptions(newGenders);
            localStorage.setItem(STORAGE_KEY_GENDERS, JSON.stringify(newGenders));
        }

        const [className, subclass] = values.characterClass.split(':');
        const selectedClass = classes.find(c => c.name === className && c.subclass === subclass);

        if (!selectedClass) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected class data not found.' });
            return;
        }

        const conModifier = Math.floor((values.stats.con - 10) / 2);
        const dexModifier = Math.floor((values.stats.dex - 10) / 2);

        const maxHp = selectedClass.hd + conModifier;
        const ac = 10 + dexModifier;

        const newCharacterId = String(Date.now());

        const newCharacter: PlayerCharacter = {
            id: newCharacterId,
            name: values.characterName,
            race: values.characterRace,
            className: className,
            subclass: subclass,
            level: 1,
            avatar: values.avatar || `https://placehold.co/100x100.png`,
            backgroundStory: values.backgroundStory || '',
            gender: values.gender,
            armorPreference: values.armorPreference,
            colorPreference: values.colorPreference,
            stats: values.stats,
            hp: maxHp,
            maxHp: maxHp,
            ac: ac,
            mp: 0,
            maxMp: 0,
        };
        
        if (selectedClass?.spellcasting_type === 'known') {
            newCharacter.spellsKnown = 2;
        }

        const isCaster = selectedClass && selectedClass.spellcasting_type && selectedClass.spellcasting_type !== 'none';
        if (isCaster) {
            const level1SlotsData = fullCasterSpellSlots.find(l => l.level === 1)?.slots;
            if (level1SlotsData) {
                newCharacter.spell_slots = {};
                for (const levelKey in level1SlotsData) {
                    if (Object.prototype.hasOwnProperty.call(level1SlotsData, levelKey)) {
                        const max = level1SlotsData[levelKey as keyof typeof level1SlotsData];
                        newCharacter.spell_slots[levelKey] = { current: max, max: max };
                    }
                }
            }
            newCharacter.mp = 10;
            newCharacter.maxMp = 10;
        }

        const updatedCharacters = [...playerCharacters, newCharacter];
        localStorage.setItem(STORAGE_KEY_PLAYER_CHARACTERS, JSON.stringify(updatedCharacters));
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVE_CHARACTER, newCharacterId);

        toast({
          title: 'Character Created!',
          description: 'Your new hero is ready for adventure.',
        });

        router.push('/character-sheet');

    } catch (error) {
        console.error("Failed to save character:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save the character." });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1 space-y-4">
              <FormLabel>Character Portrait</FormLabel>
              <Avatar className="w-full h-auto aspect-square rounded-lg border">
                <AvatarImage src={avatarUrl} className="object-cover" data-ai-hint="fantasy character" />
                <AvatarFallback className="rounded-lg">
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                </AvatarFallback>
              </Avatar>

              <div className="flex gap-2">
                 <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormLabel className="sr-only">Avatar URL</FormLabel>
                        <FormControl>
                        <Input placeholder="Paste image URL..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                 />
                 <Button type="button" variant="outline" size="icon" onClick={() => form.setValue('avatar', '')} disabled={!avatarUrl} aria-label="Remove image">
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Button type="button" onClick={handleGeneratePortrait} disabled={isAiGenDisabled} variant="outline" className="w-full">
                {isGeneratingPortrait ? 'Generating Portrait...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Portrait</>}
              </Button>
            </div>
          <div className="md:col-span-2 space-y-6">
            <FormField
              control={form.control}
              name="characterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Elara Nightshade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="characterRace"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Race</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a race" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {RACES.map(race => <SelectItem key={race} value={race}>{race}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Female, Agender" {...field} list="gender-options" />
                        </FormControl>
                        <datalist id="gender-options">
                            {genderOptions.map(option => <option key={option} value={option} />)}
                        </datalist>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
            <FormField
              control={form.control}
              name="characterClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={`${c.name}-${c.subclass}`} value={`${c.name}:${c.subclass}`}>
                          {c.name} - {c.subclass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="armorPreference"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Armor Preference</FormLabel>
                    <MultiSelectCombobox
                        options={ARMOR_PREFERENCES}
                        selected={field.value}
                        onSelectedChange={field.onChange}
                        placeholder="Select preferred armor..."
                    />
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="colorPreference"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Color Preference</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-2">
                        <Input type="color" className="w-12 h-10 p-1" {...field} />
                        <Input type="text" placeholder="#4A6572" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-lg font-medium">Ability Scores</h3>
                    <p className="text-sm text-muted-foreground">
                        Roll your stats or enter them manually (3-20).
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={handleRollStats}>
                    <Dices className="mr-2 h-4 w-4" />
                    Roll Stats
                </Button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-2 pt-2">
                <FormField control={form.control} name="stats.str" render={({ field }) => (<FormItem><FormLabel className="text-center block">STR</FormLabel><FormControl><Input type="number" {...field} className="text-center" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="stats.dex" render={({ field }) => (<FormItem><FormLabel className="text-center block">DEX</FormLabel><FormControl><Input type="number" {...field} className="text-center" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="stats.con" render={({ field }) => (<FormItem><FormLabel className="text-center block">CON</FormLabel><FormControl><Input type="number" {...field} className="text-center" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="stats.int" render={({ field }) => (<FormItem><FormLabel className="text-center block">INT</FormLabel><FormControl><Input type="number" {...field} className="text-center" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="stats.wis" render={({ field }) => (<FormItem><FormLabel className="text-center block">WIS</FormLabel><FormControl><Input type="number" {...field} className="text-center" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="stats.cha" render={({ field }) => (<FormItem><FormLabel className="text-center block">CHA</FormLabel><FormControl><Input type="number" {...field} className="text-center" /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
             <h3 className="text-lg font-medium">AI-Powered Background</h3>
             <p className="text-sm text-muted-foreground">
                Need inspiration? Provide some optional details and let our AI craft a unique backstory for your character. All fields above must be filled out to enable generation.
             </p>
            <div className="grid md:grid-cols-2 gap-6 pt-2">
                 <FormField
                  control={form.control}
                  name="desiredTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Tone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Heroic, Tragic, Mysterious" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="additionalDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Has a lost sibling" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <Button type="button" onClick={handleGenerateBackground} disabled={isAiGenDisabled} variant="outline" className="w-full md:w-auto">
              {isGeneratingBackground ? 'Generating Background...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Background</>}
            </Button>
        </div>


        <FormField
          control={form.control}
          name="backgroundStory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background Story</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Your character's history, motivations, and defining moments will appear here."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg">Create Character</Button>
      </form>
    </Form>
  );
}
