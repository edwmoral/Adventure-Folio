
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Star } from 'lucide-react';

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
} from '@/components/ui/alert-dialog';

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
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);
  
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
    
    setCampaign(newCampaign);
    setCharacterToAdd('');
    toast({ title: "Character Added", description: `${character.name} is ready for adventure!` });
  };

  const handleAddEnemyToScene = () => {
    if (!enemyToAdd || !campaign) return;
    
    const enemy = allEnemies.find(e => e.id === enemyToAdd);
    if (!enemy) return;

    const activeScene = campaign.scenes.find(s => s.is_active);
    if (!activeScene) {
        toast({ variant: "destructive", title: "No Active Scene", description: "Please set an active scene before adding an enemy." });
        return;
    }

    const newEnemyToken: Token = {
        id: `token-enemy-${Date.now()}`,
        name: enemy.name,
        imageUrl: enemy.tokenImageUrl || 'https://placehold.co/48x48.png',
        type: 'monster',
        linked_enemy_id: enemy.id,
        position: { x: 75 + Math.floor(Math.random() * 20), y: 75 + Math.floor(Math.random() * 20) } // Randomly in a corner
    };
    
    const updatedCampaign = {
        ...campaign,
        scenes: campaign.scenes.map(s => 
            s.id === activeScene.id
                ? { ...s, tokens: [...s.tokens, newEnemyToken] }
                : s
        )
    };

    setCampaign(updatedCampaign);
    setEnemyToAdd('');
    toast({ title: "Enemy Added", description: `A ${enemy.name} has been added to the active scene.` });
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
    
    setCampaign(newCampaign);
    toast({ title: "Active Scene Changed", description: "The new scene is now active for your next session." });
  };

  const handleDeleteScene = () => {
    if (!campaign || !sceneToDelete) return;

    let newCampaign = { ...campaign };
    
    if (newCampaign.scenes.length <= 1) {
        toast({ variant: "destructive", title: "Cannot Delete", description: "A campaign must have at least one scene." });
        setSceneToDelete(null);
        return;
    }

    const deletedScene = newCampaign.scenes.find(s => s.id === sceneToDelete);
    newCampaign.scenes = newCampaign.scenes.filter(s => s.id !== sceneToDelete);

    if (deletedScene?.is_active && newCampaign.scenes.length > 0) {
        newCampaign.scenes[0].is_active = true;
    }
    
    setCampaign(newCampaign);
    toast({ title: "Scene Deleted", description: "The scene has been removed from the campaign." });
    setSceneToDelete(null);
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
                    <CardDescription>Organize the maps and encounters for your campaign.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-2">
                        {campaign.scenes.map(scene => (
                            <div key={scene.id} className="flex items-center justify-between p-2 pl-3 rounded-md border">
                               <div>
                                 <p className="font-medium">{scene.name}</p>
                                 {scene.is_active && <span className="text-xs font-bold text-primary flex items-center gap-1"><Star className="h-3 w-3" />ACTIVE</span>}
                               </div>
                                <div className="flex items-center">
                                    {!scene.is_active && (
                                        <Button variant="outline" size="sm" onClick={() => handleSetSceneActive(scene.id)}>Set Active</Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="ml-1" onClick={() => setSceneToDelete(scene.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the scene and all its tokens.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setSceneToDelete(null)}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteScene}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                     </div>
                     <Button asChild variant="outline" className="w-full mt-4">
                        <Link href={`/play/${id}/scenes/new`}>Add New Scene</Link>
                     </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Enemies</CardTitle>
                    <CardDescription>Add enemies from your bestiary to the active scene.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Add an Enemy</Label>
                         <div className="flex gap-2">
                            <Select value={enemyToAdd} onValueChange={setEnemyToAdd}>
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
                            <Button onClick={handleAddEnemyToScene} disabled={!enemyToAdd}>Add to Scene</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Enemies will be added as tokens to the currently active scene.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
