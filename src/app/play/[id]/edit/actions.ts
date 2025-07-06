'use server';

import { getDocForUser, saveDocForUser, getCollectionForUser } from "@/lib/firestore";
import type { Campaign, PlayerCharacter, Token } from "@/lib/types";
import { auth } from "@/lib/firebase";

export async function addCollaborator(campaignId: string, collaboratorId: string) {
    if (!auth?.currentUser) return { success: false, error: "Not authenticated." };
    
    const campaign = await getDocForUser<Campaign>('campaigns', campaignId);
    if (!campaign) return { success: false, error: "Campaign not found or you lack permission." };
    if (campaign.userId !== auth.currentUser.uid) return { success: false, error: "Only the owner can add collaborators." };
    if (collaboratorId === auth.currentUser.uid) return { success: false, error: "You cannot add yourself as a collaborator." };
    if (campaign.collaboratorIds?.includes(collaboratorId)) return { success: false, error: "This user is already a collaborator." };

    try {
        const updatedCollaboratorIds = [...(campaign.collaboratorIds || []), collaboratorId];
        const { id, ...campaignToSave } = { ...campaign, collaboratorIds: updatedCollaboratorIds };
        await saveDocForUser('campaigns', campaignId, campaignToSave);
        return { success: true };
    } catch(e) {
        return { success: false, error: "Failed to add collaborator." };
    }
}

export async function removeCollaborator(campaignId: string, collaboratorId: string) {
    if (!auth?.currentUser) return { success: false, error: "Not authenticated." };
    
    const campaign = await getDocForUser<Campaign>('campaigns', campaignId);
    if (!campaign) return { success: false, error: "Campaign not found or you lack permission." };
    if (campaign.userId !== auth.currentUser.uid) return { success: false, error: "Only the owner can remove collaborators." };

    try {
        const updatedCollaboratorIds = (campaign.collaboratorIds || []).filter(id => id !== collaboratorId);
        const { id, ...campaignToSave } = { ...campaign, collaboratorIds: updatedCollaboratorIds };
        await saveDocForUser('campaigns', campaignId, campaignToSave);
        return { success: true };
    } catch(e) {
        return { success: false, error: "Failed to remove collaborator." };
    }
}

export async function addCharacterToCampaign(campaignId: string, characterId: string) {
    if (!auth?.currentUser) return { success: false, error: "Not authenticated." };

    const campaign = await getDocForUser<Campaign>('campaigns', campaignId);
    const characterData = await getDocForUser<PlayerCharacter>('playerCharacters', characterId);
    if (!campaign || !characterData) return { success: false, error: "Campaign or character not found." };

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
                    position: { x: 10 + Math.floor(Math.random() * 20), y: 10 + Math.floor(Math.random() * 20) }
                } as Token
            ]
        }))
    };

    try {
        const { id, ...campaignToSave } = updatedCampaign;
        await saveDocForUser('campaigns', id, campaignToSave);
        return { success: true, message: `${characterData.name} has joined the campaign!` };
    } catch(e) {
        return { success: false, error: "Failed to add character." };
    }
}

export async function removeCharacter(campaignId: string, characterId: string) {
    if (!auth?.currentUser) return { success: false, error: "Not authenticated." };

    const campaign = await getDocForUser<Campaign>('campaigns', campaignId);
    if (!campaign) return { success: false, error: "Campaign not found." };
    
    const removedChar = campaign.characters.find(c => c.id === characterId);
    const updatedCampaign = {
        ...campaign,
        characters: campaign.characters.filter(c => c.id !== characterId),
        scenes: campaign.scenes.map(scene => ({
            ...scene,
            tokens: scene.tokens.filter(token => token.linked_character_id !== characterId)
        }))
    };

    try {
        const { id, ...campaignToSave } = updatedCampaign;
        await saveDocForUser('campaigns', id, campaignToSave);
        return { success: true, message: `${removedChar?.name || 'The character'} has been removed.` };
    } catch(e) {
        return { success: false, error: "Failed to remove character." };
    }
}