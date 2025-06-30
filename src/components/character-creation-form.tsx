'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition } from 'react';

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
  const [isPending, startTransition] = useTransition();

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
      formData.append('characterClass', form.getValues('characterClass'));
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
    // For now, we just log the data.
    // In a real app, this would save to a database.
    console.log(values);
    toast({
      title: 'Character Created!',
      description: 'Your character has been saved (to the console).',
    });
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
                      <SelectItem value="Fighter">Fighter</SelectItem>
                      <SelectItem value="Wizard">Wizard</SelectItem>
                      <SelectItem value="Rogue">Rogue</SelectItem>
                      <SelectItem value="Cleric">Cleric</SelectItem>
                      <SelectItem value="Barbarian">Barbarian</SelectItem>
                      <SelectItem value="Bard">Bard</SelectItem>
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
