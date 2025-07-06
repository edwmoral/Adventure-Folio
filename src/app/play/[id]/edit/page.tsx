'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Star, Users, Shield, Copy } from 'lucide-react';

import type { Campaign, PlayerCharacter, Enemy } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/context/auth-context';
import { getDocForUser, saveDocForUser, getCollectionForUser, getGlobalCollection } from '@/lib/firestore';
import { addCollaborator, removeCharacter, addCharacterToCampaign, removeCollaborator } from './actions';

export default function EditCampaignPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState<(Campaign & {id: string}) | null>(null);
  const [allPlayerCharacters, setAllPlayerCharacters] = useState<PlayerCharacter[]>([]);
  const [allEnemies, setAllEnemies] = useState<Enemy[]>([]);
  const [characterToAdd, setCharacterToAdd] = useState<string>('');
  const [collaboratorIdToAdd, setCollaboratorIdToAdd] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, startSavingTransition] = useTransition();

  const isOwner = campaign?.userId === user?.uid;
  
  const fetchCampaignData = async () => {
    if (!user) return;
    try {
        const [campaignData, playerChars, enemies] = await Promise.all([
            getDocForUser<Campaign>('campaigns', id),
            getCollectionForUser<PlayerCharacter>('playerCharacters'),
            getGlobalCollection<Enemy>('enemies'),
        ]);

        if (campaignData) {
            if (!campaignData.scenes) campaignData.scenes = [];
            if (!campaignData.collaboratorIds) campaignData.collaboratorIds = [];
            setCampaign(campaignData);
        } else {
             toast({ variant: 'destructive', title: 'Error', description: 'Campaign not found or you lack permission to edit it.' });
             router.push('/play');
        }
        setAllPlayerCharacters(playerChars.sort((a,b) => a.name.localeCompare(b.name)));
        setAllEnemies(enemies.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (error) {
        console.error("Failed to load campaign data from Firestore", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load campaign data.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [id, user, toast, router]);

  const saveCampaign = async (updatedCampaign: Campaign) => {
    if (!campaign) return false;
    const { id: campaignId, ...campaignToSave } = { ...campaign, ...updatedCampaign };
    try {
        await saveDocForUser('campaigns', campaignId, campaignToSave);
        return true;
    } catch (error) {
        console.error("Failed to save campaign:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save campaign changes." });
        return false;
    }
  };
  
  const handleSaveChanges = async () => {
    if (!campaign) return;
    startSavingTransition(async () => {
        const success = await saveCampaign(campaign);
        if (success) {
            toast({ title: "Campaign Saved!", description: "Your changes have been successfully saved." });
            router.push(`/play/${campaign.id}`);
        }
    });
  };

  const handleRemoveCharacterClick = (characterId: string) => {
    startSavingTransition(async () => {
        const result = await removeCharacter(id, characterId);
        if (result.success) {
            toast({ title: "Character Removed", description: result.message });
            await fetchCampaignData();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
  };

  const handleAddCharacterClick = () => {
    if (!characterToAdd || !campaign) return;
    startSavingTransition(async () => {
        const result = await addCharacterToCampaign(id, characterToAdd);
        if (result.success) {
            toast({ title: "Character Added", description: result.message });
            setCharacterToAdd('');
            await fetchCampaignData();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
  };
  
  const handleAddCollaborator = () => {
    if (!collaboratorIdToAdd.trim() || !campaign) return;
    startSavingTransition(async () => {
        const result = await addCollaborator(id, collaboratorIdToAdd);
        if (result.success) {
            toast({ title: "Collaborator Added", description: "The user can now access this campaign." });
            setCollaboratorIdToAdd('');
            await fetchCampaignData();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
  };
  
  const handleRemoveCollaborator = (collaboratorId: string) => {
    startSavingTransition(async () => {
        const result = await removeCollaborator(id, collaboratorId);
        if (result.success) {
            toast({ title: "Collaborator Removed", description: "The user's access has been revoked." });
            await fetchCampaignData();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
  };

  const handleSetSceneActive = (sceneId: string) => {
    if (!campaign) return;
    const updatedScenes = campaign.scenes.map(s => ({ ...s, is_active: s.id === sceneId }));
    saveCampaign({ ...campaign, scenes: updatedScenes }).then(success => {
        if (success) {
            toast({ title: "Active Scene Changed", description: "The new scene is now active." });
            fetchCampaignData();
        }
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!campaign) return;
    if (campaign.scenes.length <= 1) {
        toast({ variant: "destructive", title: "Cannot Delete", description: "A campaign must have at least one scene." });
        return;
    }

    const deletedScene = campaign.scenes.find(s => s.id === sceneId);
    let updatedScenes = campaign.scenes.filter(s => s.id !== sceneId);
    if (deletedScene?.is_active && updatedScenes.length > 0) {
        updatedScenes[0].is_active = true;
    }
    
    saveCampaign({ ...campaign, scenes: updatedScenes }).then(success => {
        if (success) {
            toast({ title: "Scene Deleted", description: "The scene has been removed." });
            fetchCampaignData();
        }
    });
  };

  const handleSceneDimensionChange = (sceneId: string, dimension: 'width' | 'height', value: number) => {
    if (!campaign || isNaN(value)) return;
    const newCampaign = { ...campaign, scenes: campaign.scenes.map(scene => scene.id === sceneId ? { ...scene, [dimension]: value } : scene) };
    setCampaign(newCampaign);
  };
  
  const availableCharacters = allPlayerCharacters.filter(char => !campaign?.characters.some((c) => c.id === char.id));

  if (loading) {
    return <div className="text-center p-8">Loading Campaign Editor...</div>;
  }
  if (!campaign) {
    return <div className="text-center p-8">Campaign not found.</div>;
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
        <Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="space-y-8 lg:col-span-1">
            <Card>
                <CardHeader> <CardTitle>Campaign Details</CardTitle> <CardDescription>Update the basic information for your campaign.</CardDescription> </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input id="campaign-name" value={campaign.name} onChange={(e) => setCampaign({ ...campaign, name: e.target.value })} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader> <CardTitle>Manage Characters</CardTitle> <CardDescription>Add or remove characters from this campaign.</CardDescription> </CardHeader>
                <CardContent className="space-y-4">
                    <Label>Characters in Campaign</Label>
                    <div className="space-y-2 rounded-md border p-2">
                        {campaign.characters.length > 0 ? campaign.characters.map(char => (
                            <div key={char.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9"> <AvatarImage src={char.avatarUrl} data-ai-hint="fantasy character" /> <AvatarFallback>{char.name.substring(0,1)}</AvatarFallback> </Avatar>
                                    <div> <p className="font-medium">{char.name}</p> <p className="text-xs text-muted-foreground">{char.class} / Level {char.level}</p> </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveCharacterClick(char.id)} disabled={isSaving}> <Trash2 className="h-4 w-4 text-destructive" /> </Button>
                            </div>
                        )) : <p className="text-sm text-muted-foreground p-2 text-center">No characters yet.</p>}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label>Add a Character</Label>
                         <div className="flex gap-2">
                            <Select value={characterToAdd} onValueChange={setCharacterToAdd}>
                                <SelectTrigger> <SelectValue placeholder="Select a character..." /> </SelectTrigger>
                                <SelectContent>
                                    {availableCharacters.map(char => ( <SelectItem key={char.id} value={char.id}> {char.name} ({char.className} Lvl {char.level}) </SelectItem> ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAddCharacterClick} disabled={!characterToAdd || isSaving}>Add</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

             {isOwner && (
                <Card>
                    <CardHeader> <CardTitle>Manage Collaborators</CardTitle> <CardDescription>Invite other users to view and edit this campaign.</CardDescription> </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Your User ID</Label>
                            <div className="flex items-center gap-2">
                                <Input value={user?.uid} readOnly className="font-mono text-xs"/>
                                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(user?.uid || ''); toast({title: "Copied!", description: "Your User ID has been copied."})}}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Label>Collaborators</Label>
                        <div className="space-y-2 rounded-md border p-2">
                           {(campaign.collaboratorIds || []).map(cid => (
                                <div key={cid} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                    <p className="font-mono text-xs truncate">{cid}</p>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCollaborator(cid)} disabled={isSaving}> <Trash2 className="h-4 w-4 text-destructive" /> </Button>
                                </div>
                            ))}
                            {(!campaign.collaboratorIds || campaign.collaboratorIds.length === 0) && (
                                <p className="text-sm text-muted-foreground p-2 text-center">No collaborators yet.</p>
                            )}
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Add by User ID</Label>
                            <div className="flex gap-2">
                                <Input placeholder="Paste user ID..." value={collaboratorIdToAdd} onChange={(e) => setCollaboratorIdToAdd(e.target.value)} />
                                <Button onClick={handleAddCollaborator} disabled={!collaboratorIdToAdd || isSaving}>Add</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
        
        <div className="space-y-8 lg:col-span-2">
            <Card>
                <CardHeader> <CardTitle>Manage Scenes</CardTitle> <CardDescription>Organize maps, encounters, and campaign flow.</CardDescription> </CardHeader>
                <CardContent>
                     <Accordion type="multiple" className="w-full space-y-2">
                         {campaign.scenes.map(scene => {
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
                                            {scene.description && <p className="text-sm text-muted-foreground italic">"{scene.description}"</p>}
                                            <div className="flex items-center gap-2">
                                                {!scene.is_active && ( <Button variant="outline" size="sm" onClick={() => handleSetSceneActive(scene.id)}>Set Active</Button> )}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild> <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive"> <Trash2 className="mr-2 h-4 w-4" /> Delete Scene </Button> </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription> This action cannot be undone. This will permanently delete the scene '{scene.name}' and all its tokens. </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={() => handleDeleteScene(scene.id)}>Delete</AlertDialogAction> </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            <Separator/>
                                            <div>
                                                <h4 className="mb-2 font-semibold text-sm">Scene Dimensions</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`scene-width-${scene.id}`}>Width (squares)</Label>
                                                        <Input id={`scene-width-${scene.id}`} type="number" value={scene.width || ''} onChange={(e) => handleSceneDimensionChange(scene.id, 'width', parseInt(e.target.value))} placeholder="e.g., 30" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`scene-height-${scene.id}`}>Height (squares)</Label>
                                                        <Input id={`scene-height-${scene.id}`} type="number" value={scene.height || ''} onChange={(e) => handleSceneDimensionChange(scene.id, 'height', parseInt(e.target.value))} placeholder="e.g., 20" />
                                                    </div>
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
