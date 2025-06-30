
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
import { generateBackgroundAction } from '@/app/character/create/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import type { Class, PlayerCharacter } from '@/lib/types';

const STORAGE_KEY_CLASSES = 'dnd_classes';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';

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
  backgroundStory: z.string().optional(),
  desiredTone: z.string().optional(),
  additionalDetails: z.string().optional(),
});

export function CharacterCreationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
    },
  });

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

  function onSubmit(values: z.infer<typeof characterFormSchema>) {
    try {
        const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
        const playerCharacters: PlayerCharacter[] = storedCharacters ? JSON.parse(storedCharacters) : [];
        
        const [className, subclass] = values.characterClass.split(':');

        const newCharacter: PlayerCharacter = {
            id: String(Date.now()),
            name: values.characterName,
            race: values.characterRace,
            className: className,
            subclass: subclass,
            level: 1,
            avatar: `https://placehold.co/100x100.png`,
            backgroundStory: values.backgroundStory || '',
            stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            hp: 10,
            maxHp: 10,
            ac: 10,
            mp: 10,
            maxMp: 10,
        };

        const updatedCharacters = [...playerCharacters, newCharacter];
        localStorage.setItem(STORAGE_KEY_PLAYER_CHARACTERS, JSON.stringify(updatedCharacters));

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
        <div className="grid md:grid-cols-3 gap-6">
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
            <Button type="button" onClick={handleGenerateBackground} disabled={isPending} variant="outline" className="w-full md:w-auto">
              {isPending ? 'Generating...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Background</>}
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
