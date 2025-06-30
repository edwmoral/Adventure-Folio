
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
import { Sparkles, User } from 'lucide-react';
import type { Class, PlayerCharacter } from '@/lib/types';
import { fullCasterSpellSlots } from '@/lib/dnd-data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const STORAGE_KEY_CLASSES = 'dnd_classes';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';
const STORAGE_KEY_LAST_ACTIVE_CHARACTER = 'dnd_last_active_character_id';

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
  avatar: z.string().optional(),
  backgroundStory: z.string().optional(),
  desiredTone: z.string().optional(),
  additionalDetails: z.string().optional(),
});

export function CharacterCreationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGeneratingPortrait, startPortraitTransition] = useTransition();
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    try {
      const storedClasses = localStorage.getItem(STORAGE_KEY_CLASSES);
      if (storedClasses) {
        setClasses(JSON.parse(storedClasses));
      }
    } catch (error) {
      console.error("Failed to load classes from localStorage", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load class data.' });
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
    },
  });

  const avatarUrl = form.watch('avatar');

  const handleGenerateBackground = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('characterName', form.getValues('characterName'));
      formData.append('characterRace', form.getValues('characterRace'));
      // For the AI, we only need the base class name
      const [className] = (form.getValues('characterClass') || ':').split(':');
      formData.append('characterClass', className);
      formData.append('desiredTone', form.getValues('desiredTone'));
      formData.append('additionalDetails', form.getValues('additionalDetails'));

      const result = await generateBackgroundAction(formData);

      if (result.success) {
        form.setValue('backgroundStory', result.background || '');
        toast({
          title: 'Background Generated!',
          description: "Your character's story has been written.",
        });
      } else {
        const errorMsg = result.error?._form?.[0] ?? 'An unknown error occurred.';
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: errorMsg,
        });
      }
    });
  };
  
  const handleGeneratePortrait = () => {
    startPortraitTransition(async () => {
      const formData = new FormData();
      const backstory = form.getValues('backgroundStory');
      if (!backstory) {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'Please generate or write a background story first to provide context for the portrait.',
        });
        return;
      }
      formData.append('characterRace', form.getValues('characterRace'));
      const [className] = (form.getValues('characterClass') || ':').split(':');
      formData.append('characterClass', className);
      formData.append('characterDescription', backstory);

      const result = await generatePortraitAction(formData);

      if (result.success && result.imageUrl) {
        form.setValue('avatar', result.imageUrl);
        toast({
          title: 'Portrait Generated!',
          description: "Your character's portrait is ready.",
        });
      } else {
        const errorMsg = result.error?._form?.[0] ?? 'An unknown error occurred.';
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: errorMsg,
        });
      }
    });
  };


  function onSubmit(values: z.infer<typeof characterFormSchema>) {
    try {
        const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
        const playerCharacters: PlayerCharacter[] = storedCharacters ? JSON.parse(storedCharacters) : [];
        
        const [className, subclass] = values.characterClass.split(':');

        const selectedClass = classes.find(c => c.name === className && c.subclass === subclass);
        const isCaster = selectedClass && ['Intelligence', 'Wisdom', 'Charisma'].includes(selectedClass.primary_ability);

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
            stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            hp: 10,
            maxHp: 10,
            ac: 10,
            mp: 0,
            maxMp: 0,
        };
        
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

              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Paste image URL..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="button" onClick={handleGeneratePortrait} disabled={isGeneratingPortrait || isPending} variant="outline" className="w-full">
                {isGeneratingPortrait ? 'Generating Portrait...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Portrait</>}
              </Button>
              <p className="text-xs text-muted-foreground">
                Tip: Generate a background story first for a better portrait result.
              </p>
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
                      <SelectItem value="Human">Human</SelectItem>
                      <SelectItem value="Elf">Elf</SelectItem>
                      <SelectItem value="Dwarf">Dwarf</SelectItem>
                      <SelectItem value="Halfling">Halfling</SelectItem>
                      <SelectItem value="Dragonborn">Dragonborn</SelectItem>
                      <SelectItem value="Gnome">Gnome</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
             <h3 className="text-lg font-medium">AI-Powered Background</h3>
             <p className="text-sm text-muted-foreground">
                Need inspiration? Provide some optional details and let our AI craft a unique backstory for your character.
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
            <Button type="button" onClick={handleGenerateBackground} disabled={isPending || isGeneratingPortrait} variant="outline" className="w-full md:w-auto">
              {isPending ? 'Generating Background...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Background</>}
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
