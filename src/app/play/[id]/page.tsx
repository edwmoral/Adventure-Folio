'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Users, UserPlus, Pencil, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Campaign, Character, PlayerCharacter, Token } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { getDocForUser, getCollectionForUser, saveDocForUser } from '@/lib/firestore';

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { user } = useAuth();
    const [campaign, setCampaign] = useState<(Campaign & {id: string}) | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [allPlayerCharacters, setAllPlayerCharacters] = useState<PlayerCharacter[]>([]);
    const [characterToAdd, setCharacterToAdd] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [campaignData, playerCharacters] = await Promise.all([
                    getDocForUser<Campaign>('campaigns', id),
                    getCollectionForUser<PlayerCharacter>('playerCharacters')
                ]);

                if (!campaignData) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Campaign not found or you do not have permission to view it.' });
                    router.push('/play');
                    return;
                }
                
                setCampaign(campaignData);
                setAllPlayerCharacters(playerCharacters.sort((a,b) => a.name.localeCompare(b.name)));
            } catch (error) {
                console.error("Failed to load data from Firestore", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load campaign data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user, toast, router]);

    const saveUpdatedCampaign = async (updatedCampaign: Campaign & {id: string}) => {
        try {
            const { id: campaignId, ...campaignToSave } = updatedCampaign;
            await saveDocForUser('campaigns', campaignId, campaignToSave);
            setCampaign(updatedCampaign);
        } catch (error) {
            console.error("Failed to save campaign:", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save campaign changes." });
        }
    };
    
    const handleRemoveCharacter = (characterId: string) => {
        if (!campaign) return;

        const removedChar = campaign.characters.find(c => c.id === characterId);
        const updatedCampaign = {
            ...campaign,
            characters: campaign.characters.filter(c => c.id !== characterId),
            scenes: campaign.scenes.map(scene => ({
                ...scene,
                tokens: scene.tokens.filter(token => token.linked_character_id !== characterId)
            }))
        };
        saveUpdatedCampaign(updatedCampaign);
        toast({ title: "Character Removed", description: `${removedChar?.name || 'The character'} has been removed.` });
    };
    
    const handleAddCharacter = () => {
        if (!characterToAdd || !campaign) return;

        const characterData = allPlayerCharacters.find(c => c.id === characterToAdd);
        if (!characterData) return;

        const newCharacterForCampaign: Character = {
            id: characterData.id,
            name: characterData.name,
            avatarUrl: characterData.avatar,
            class: characterData.className,
            level: characterData.level,
            tokenImageUrl: `https://placehold.co/48x48.png`
        };

        const updatedCampaign: Campaign & {id: string} = { 
            ...campaign,
            characters: [...campaign.characters, newCharacterForCampaign],
            scenes: campaign.scenes.map(scene => ({
                ...scene,
                tokens: [
                    ...scene.tokens,
                    {
                        id: `token-${Date.now()}-${Math.random()}`,
                        name: characterData.name,
                        imageUrl: newCharacterForCampaign.tokenImageUrl || 'https://placehold.co/48x48.png',
                        type: 'character',
                        linked_character_id: characterData.id,
                        position: { x: 10 + Math.floor(Math.random() * 10), y: 10 + Math.floor(Math.random() * 10) }
                    } as Token
                ]
            }))
        };
        
        saveUpdatedCampaign(updatedCampaign);
        setCharacterToAdd('');
        setIsAddDialogOpen(false);
        toast({ title: 'Character Added', description: `${characterData.name} has joined the campaign!` });
    };

    const availableCharacters = campaign ? allPlayerCharacters.filter(
      (char) => !campaign.characters.some((c) => c.id === char.id)
    ) : [];

    if (loading) return <div className="text-center p-8">Loading campaign...</div>;
    
    if (!campaign) return null; // Already handled by redirect in useEffect

    return (
        <div className="space-y-6">
             <Button asChild variant="ghost">
                <Link href="/play">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Campaigns
                </Link>
            </Button>
            
            <Card className="overflow-hidden">
                <div className="relative h-48 md:h-64 w-full">
                    <Image
                        src={campaign.imageUrl}
                        alt={`${campaign.name} banner image`}
                        fill
                        className="object-cover"
                        data-ai-hint="fantasy landscape"
                    />
                </div>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-4xl font-headline">{campaign.name}</CardTitle>
                            <CardDescription>A classic adventure filled with mystery, danger, and a fortress swallowed by the earth.</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="icon">
                            <Link href={`/play/${campaign.id}/edit`}>
                                <Pencil className="h-5 w-5" />
                                <span className="sr-only">Edit Campaign</span>
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Users className="h-5 w-5" />
                            Characters in this Campaign
                        </h3>
                        <div className="flex flex-wrap items-center gap-6">
                            {campaign.characters.map(char => (
                                <div key={char.id} className="relative group/char">
                                    <div className="flex items-center gap-2 p-2 pr-3 border rounded-lg bg-card-foreground/5 transition-all group-hover/char:border-primary/50">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={char.avatarUrl} data-ai-hint="fantasy character" />
                                            <AvatarFallback>{char.name.substring(0,1)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{char.name}</span>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover/char:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveCharacter(char.id)}
                                    >
                                        <X className="h-3 w-3" />
                                        <span className="sr-only">Remove {char.name}</span>
                                    </Button>
                                </div>
                            ))}
                             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="h-auto p-2 flex items-center justify-center flex-col gap-1 w-[68px] h-[60px] border-dashed hover:border-solid">
                                        <UserPlus className="h-5 w-5" />
                                        <span className="text-xs">Add</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Character to Campaign</DialogTitle>
                                        <DialogDescription>
                                            Select a character from your roster to add to "{campaign.name}".
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label htmlFor="character-select" className="mb-2 block">Available Characters</Label>
                                        <Select value={characterToAdd} onValueChange={setCharacterToAdd}>
                                            <SelectTrigger id="character-select">
                                                <SelectValue placeholder="Select a character..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableCharacters.length > 0 ? (
                                                    availableCharacters.map(char => (
                                                        <SelectItem key={char.id} value={char.id}>
                                                            {char.name} ({char.className} Lvl {char.level})
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="none" disabled>No available characters</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAddCharacter} disabled={!characterToAdd || characterToAdd === 'none'}>Add Character</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                 <Button asChild size="lg">
                    <Link href={`/play/${id}/board`}>
                        <Play className="mr-2 h-5 w-5" />
                        Launch Game Board
                    </Link>
                </Button>
            </div>
        </div>
    );
}
