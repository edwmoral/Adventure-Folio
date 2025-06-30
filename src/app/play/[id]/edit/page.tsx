
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Star, Users, Shield } from 'lucide-react';

import type { Campaign, Character, Scene, Token, PlayerCharacter, Enemy } from '@/lib/types';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const STORAGE_KEY = 'dnd_campaigns';
const STORAGE_KEY_PLAYER_CHARACTERS = 'dnd_player_characters';
const STORAGE_KEY_ENEMIES = 'dnd_enemies';


export default function EditCampaignPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [allPlayerCharacters, setAllPlayerCharacters] = useState<Character[]>([]);
  const [allEnemies, setAllEnemies] = useState<Enemy[]>([]);
  const [characterToAdd, setCharacterToAdd] = useState<string>('');
  const [enemyToAdd, setEnemyToAdd] = useState<string>('');
  
  useEffect(() => {
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        if (storedCampaigns) {
            const campaigns: Campaign[] = JSON.parse(storedCampaigns);
            const currentCampaign = campaigns.find(c => c.id === id);
            
            if (currentCampaign) {
                if (!currentCampaign.scenes) {
                    currentCampaign.scenes = [];
                }
            }
            setCampaign(currentCampaign || null);
        }

        const storedCharacters = localStorage.getItem(STORAGE_KEY_PLAYER_CHARACTERS);
        if (storedCharacters) {
            const playerCharacters: PlayerCharacter[] = JSON.parse(storedCharacters);
            const charactersForCampaign: Character[] = playerCharacters.map(pc => ({
                id: pc.id,
                name: pc.name,
                avatarUrl: pc.avatar,
                class: pc.className,
                level: pc.level,
                tokenImageUrl: `https://placehold.co/48x48.png`
            }));
            setAllPlayerCharacters(charactersForCampaign);
        }

        const storedEnemies = localStorage.getItem(STORAGE_KEY_ENEMIES);
        if (storedEnemies) {
            setAllEnemies(JSON.parse(storedEnemies));
        }

    } catch (error) {
        console.error("Failed to load campaign from localStorage", error);
    }
  }, [id]);

  const availableCharacters = allPlayerCharacters.filter(
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
    const removedCharacterName = newCampaign.characters.find(c => c.id === characterId)?.name;

    newCampaign.characters = newCampaign.characters.filter(c => c.id !== characterId);
    newCampaign.scenes = newCampaign.scenes.map(scene => ({
        ...scene,
        tokens: scene.tokens.filter(token => token.linked_character_id !== characterId)
    }));
    
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
        const updatedCampaigns = campaigns.map(c => c.id === newCampaign.id ? newCampaign : c);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));

        setCampaign(newCampaign);
        toast({ title: "Character Removed", description: `${removedCharacterName || 'The character'} has been removed from the campaign.` });
    } catch (error) {
        console.error("Failed to remove character:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not remove character." });
    }
  };

  const handleAddCharacter = () => {
    if (!characterToAdd || !campaign) return;
    
    const character = allPlayerCharacters.find(c => c.id === characterToAdd);
    if (!character) return;
    
    const newCampaign = { ...campaign };
    newCampaign.characters.push(character);
    
    newCampaign.scenes.forEach(scene => {
        const newToken: Token = {
            id: `token-${Date.now()}-${Math.random()}`,
            name: character.name,
            imageUrl: character.tokenImageUrl || 'https://placehold.co/48x48.png',
            type: 'character',
            linked_character_id: character.id,
            position: { x: 10 + Math.floor(Math.random() * 10), y: 10 + Math.floor(Math.random() * 10) }
        };
        scene.tokens.push(newToken);
    });
    
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
        const updatedCampaigns = campaigns.map(c => c.id === newCampaign.id ? newCampaign : c);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));

        setCampaign(newCampaign);
        setCharacterToAdd('');
        toast({ title: "Character Added", description: `${character.name} is ready for adventure!` });
    } catch (error) {
        console.error("Failed to add character:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not add character." });
    }
  };

  const handleAddEnemyToScene = (sceneId: string) => {
    if (!enemyToAdd || !campaign) return;

    const enemy = allEnemies.find((e) => e.id === enemyToAdd);
    if (!enemy) return;

    const targetScene = campaign.scenes.find((s) => s.id === sceneId);
    if (!targetScene) {
      toast({
        variant: 'destructive',
        title: 'Scene Not Found',
        description: 'The scene to add the enemy to could not be found.',
      });
      return;
    }

    const newEnemyToken: Token = {
      id: `token-enemy-${Date.now()}`,
      name: enemy.name,
      imageUrl: enemy.tokenImageUrl || 'https://placehold.co/48x48.png',
      type: 'monster',
      linked_enemy_id: enemy.id,
      hp: enemy.hit_points,
      maxHp: enemy.hit_points,
      mp: enemy.mp || 0,
      maxMp: enemy.mp || 0,
      position: {
        x: 75 + Math.floor(Math.random() * 20),
        y: 75 + Math.floor(Math.random() * 20),
      },
    };

    const updatedCampaign = {
      ...campaign,
      scenes: campaign.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, tokens: [...s.tokens, newEnemyToken] }
          : s
      ),
    };

    try {
      const storedCampaigns = localStorage.getItem(STORAGE_KEY);
      const campaigns: Campaign[] = storedCampaigns
        ? JSON.parse(storedCampaigns)
        : [];
      const updatedCampaignsList = campaigns.map((c) =>
        c.id === updatedCampaign.id ? updatedCampaign : c
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaignsList));

      setCampaign(updatedCampaign);
      setEnemyToAdd('');
      toast({
        title: 'Enemy Added',
        description: `A ${enemy.name} has been added to the scene.`,
      });
    } catch (error) {
      console.error('Failed to add enemy:', error);
      toast({
        variant: 'destructive',
        title: 'Add Failed',
        description: 'Could not add the enemy to the scene.',
      });
    }
  };

  const handleSetSceneActive = (sceneId: string) => {
    if (!campaign) return;

    const newCampaign = {
        ...campaign,
        scenes: campaign.scenes.map(s => ({
            ...s,
            is_active: s.id === sceneId,
        }))
    };
    
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
        const updatedCampaigns = campaigns.map(c => c.id === newCampaign.id ? newCampaign : c);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));
        
        setCampaign(newCampaign);
        toast({ title: "Active Scene Changed", description: "The new scene is now active for your next session." });
    } catch (error) {
        console.error("Failed to set active scene:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not set active scene." });
    }
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!campaign) return;

    let newCampaign = { ...campaign };
    
    if (newCampaign.scenes.length <= 1) {
        toast({ variant: "destructive", title: "Cannot Delete", description: "A campaign must have at least one scene." });
        return;
    }

    const deletedScene = newCampaign.scenes.find(s => s.id === sceneId);
    newCampaign.scenes = newCampaign.scenes.filter(s => s.id !== sceneId);

    if (deletedScene?.is_active && newCampaign.scenes.length > 0) {
        newCampaign.scenes[0].is_active = true;
    }
    
    try {
        const storedCampaigns = localStorage.getItem(STORAGE_KEY);
        const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
        const updatedCampaigns = campaigns.map(c => c.id === newCampaign.id ? newCampaign : c);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));
        
        setCampaign(newCampaign);
        toast({ title: "Scene Deleted", description: "The scene has been removed from the campaign." });
    } catch (error) {
        console.error("Failed to delete scene:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not delete scene." });
    }
  };

  const handleRemoveEnemyFromScene = (sceneId: string, tokenId: string) => {
    if (!campaign) return;

    const updatedCampaign = {
      ...campaign,
      scenes: campaign.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, tokens: s.tokens.filter((t) => t.id !== tokenId) }
          : s
      ),
    };

    try {
      const storedCampaigns = localStorage.getItem(STORAGE_KEY);
      const campaigns: Campaign[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];
      const updatedCampaignsList = campaigns.map((c) =>
        c.id === updatedCampaign.id ? updatedCampaign : c
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaignsList));

      setCampaign(updatedCampaign);
      toast({
        title: 'Enemy Removed',
        description: 'The enemy has been removed from the scene.',
      });
    } catch (error) {
      console.error('Failed to remove enemy:', error);
      toast({
        variant: 'destructive',
        title: 'Remove Failed',
        description: 'Could not remove the enemy from the scene.',
      });
    }
  };


  if (!campaign) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <Button asChild variant="ghost">
                <Link href={`/play/${id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Campaign
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline mt-2">Edit Campaign: {campaign.name}</h1>
        </div>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Campaign & Character Column */}
        <div className="space-y-8 lg:col-span-1">
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
        
        {/* Scenes & Enemies Column */}
        <div className="space-y-8 lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Scenes</CardTitle>
                    <CardDescription>Organize maps, encounters, and campaign flow.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Accordion type="multiple" className="w-full space-y-2">
                         {campaign.scenes.map(scene => {
                             const enemyTokens = scene.tokens.filter(t => t.type === 'monster');
                             return (
                                <AccordionItem value={scene.id} key={scene.id} className="border rounded-md data-[state=closed]:border-border data-[state=open]:border-primary/50">
                                    <AccordionTrigger className="p-3 hover:no-underline text-left">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                {scene.is_active && <Star className="h-4 w-4 text-primary" />}
                                                <p className="font-medium">{scene.name}</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        <div className="space-y-4">
                                            {scene.description && (
                                                <p className="text-sm text-muted-foreground italic">"{scene.description}"</p>
                                            )}

                                            {/* Scene Actions */}
                                            <div className="flex items-center gap-2">
                                                {!scene.is_active && (
                                                    <Button variant="outline" size="sm" onClick={() => handleSetSceneActive(scene.id)}>Set Active</Button>
                                                )}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Scene
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the scene '{scene.name}' and all its tokens.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteScene(scene.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>

                                            <Separator/>

                                            {/* Enemy List */}
                                            <div>
                                                <h4 className="mb-2 font-semibold text-sm flex items-center gap-2"><Shield className="h-4 w-4"/>Enemies in Scene:</h4>
                                                {enemyTokens.length > 0 ? (
                                                    <div className="space-y-1 rounded-md border p-2">
                                                        {enemyTokens.map(token => (
                                                            <div key={token.id} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-muted/50">
                                                                <span>{token.name}</span>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveEnemyFromScene(scene.id, token.id)}>
                                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-center text-muted-foreground py-2">No enemies in this scene.</p>
                                                )}
                                            </div>

                                            {/* Add Enemy */}
                                            <div>
                                                <Label className="text-sm font-semibold">Add Enemy to this Scene</Label>
                                                <div className="flex gap-2 mt-2">
                                                    <Select onValueChange={setEnemyToAdd}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select an enemy..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {allEnemies.map(enemy => (
                                                                <SelectItem key={enemy.id} value={enemy.id}>
                                                                    {enemy.name} (CR {enemy.challenge_rating})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button onClick={() => handleAddEnemyToScene(scene.id)} disabled={!enemyToAdd}>Add</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                             );
                         })}
                     </Accordion>
                     <Button asChild variant="outline" className="w-full mt-4">
                        <Link href={`/play/${id}/scenes/new`}>Add New Scene</Link>
                     </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
