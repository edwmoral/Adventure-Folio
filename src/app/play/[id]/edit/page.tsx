'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';

import type { Campaign, Character, Scene, Token } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STORAGE_KEY = 'dnd_campaigns';

// Mock list of all characters a user might have
const MOCK_AVAILABLE_CHARACTERS: Character[] = [
    { id: 'char1', name: 'Eldrin', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png', class: 'Ranger', level: 5 },
    { id: 'char2', name: 'Lyra', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png', class: 'Wizard', level: 4 },
    { id: 'char3', name: 'Borg', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png', class: 'Fighter', level: 6 },
    { id: 'char4', name: 'Gandalf', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png', class: 'Wizard', level: 20 },
    { id: 'char5', name: 'Bilbo', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png', class: 'Rogue', level: 8 },
    { id: 'char6', name: 'Frodo', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png', class: 'Rogue', level: 2 },
    { id: 'char7', name: 'Sam', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png', class: 'Gardener', level: 3 },
    { id: 'char8', name: 'Pippin', avatarUrl: 'https://placehold.co/40x40.png', tokenImageUrl: 'https://placehold.co/48x48.png', class: 'Fool of a Took', level: 2 },
];

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characterToAdd, setCharacterToAdd] = useState<string>('');
  
  useEffect(() => {
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        if (storedCampaigns) {
            const campaigns: Campaign[] = JSON.parse(storedCampaigns);
            const currentCampaign = campaigns.find(c => c.id === params.id);
            setCampaign(currentCampaign || null);
        }
    } catch (error) {
        console.error("Failed to load campaign from localStorage", error);
    }
  }, [params.id]);

  const availableCharacters = MOCK_AVAILABLE_CHARACTERS.filter(
    (char) => !campaign?.characters.some((c) => c.id === char.id)
  );

  const handleSaveChanges = () => {
    if (!campaign) return;
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
        const updatedCampaigns = campaigns.map(c => c.id === campaign.id ? campaign : c);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));
        toast({ title: "Campaign Saved!", description: "Your changes have been successfully saved." });
        router.push(`/play/${campaign.id}`);
    } catch (error) {
        console.error("Failed to save campaign:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save changes." });
    }
  };

  const handleRemoveCharacter = (characterId: string) => {
    if (!campaign) return;

    const newCampaign = { ...campaign };

    newCampaign.characters = newCampaign.characters.filter(c => c.id !== characterId);
    newCampaign.scenes = newCampaign.scenes.map(scene => ({
        ...scene,
        tokens: scene.tokens.filter(token => token.linked_character_id !== characterId)
    }));
    
    setCampaign(newCampaign);
    toast({ title: "Character Removed", description: "The character has been removed from the campaign." });
  };

  const handleAddCharacter = () => {
    if (!characterToAdd || !campaign) return;
    
    const character = MOCK_AVAILABLE_CHARACTERS.find(c => c.id === characterToAdd);
    if (!character) return;
    
    const newCampaign = { ...campaign };
    newCampaign.characters.push(character);
    
    const activeScene = newCampaign.scenes.find(s => s.is_active);
    if (activeScene) {
        const newToken: Token = {
            id: `token-${Date.now()}`,
            name: character.name,
            imageUrl: character.tokenImageUrl || 'https://placehold.co/48x48.png',
            type: 'character',
            linked_character_id: character.id,
            position: { x: 10 + Math.random() * 10, y: 10 + Math.random() * 10 }
        };
        activeScene.tokens.push(newToken);
    }
    
    setCampaign(newCampaign);
    setCharacterToAdd('');
    toast({ title: "Character Added", description: `${character.name} is ready for adventure!` });
  };

  if (!campaign) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <Button asChild variant="ghost">
                <Link href={`/play/${params.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Campaign
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline mt-2">Edit Campaign: {campaign.name}</h1>
        </div>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
            {/* Campaign Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>Update the basic information for your campaign.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                            id="campaign-name"
                            value={campaign.name}
                            onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Character Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Manage Characters</CardTitle>
                    <CardDescription>Add or remove characters from this campaign.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Label>Characters in Campaign</Label>
                    <div className="space-y-2 rounded-md border p-2">
                        {campaign.characters.length > 0 ? campaign.characters.map(char => (
                            <div key={char.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={char.avatarUrl} data-ai-hint="fantasy character" />
                                        <AvatarFallback>{char.name.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{char.name}</p>
                                        <p className="text-xs text-muted-foreground">{char.class} / Level {char.level}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveCharacter(char.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        )) : <p className="text-sm text-muted-foreground p-2 text-center">No characters yet.</p>}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Add a Character</Label>
                         <div className="flex gap-2">
                            <Select value={characterToAdd} onValueChange={setCharacterToAdd}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a character..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCharacters.map(char => (
                                        <SelectItem key={char.id} value={char.id}>
                                            {char.name} ({char.class} Lvl {char.level})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAddCharacter} disabled={!characterToAdd}>Add</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        {/* Scene Management (Placeholder) */}
        <Card>
            <CardHeader>
                <CardTitle>Manage Scenes</CardTitle>
                <CardDescription>Organize the maps and encounters for your campaign.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    {campaign.scenes.map(scene => (
                        <div key={scene.id} className="flex items-center justify-between p-3 rounded-md border">
                            <p className="font-medium">{scene.name}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled>Edit</Button>
                                {scene.is_active && <span className="text-xs font-bold text-primary self-center">ACTIVE</span>}
                            </div>
                        </div>
                    ))}
                 </div>
                 <Button variant="outline" className="w-full mt-4" disabled>Add New Scene</Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
