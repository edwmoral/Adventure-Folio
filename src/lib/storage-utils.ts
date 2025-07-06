
'use client';

import type { Campaign } from './types';

const STORAGE_KEY_CAMPAIGNS = 'dnd_campaigns';
const STORAGE_KEY_MAPS = 'dnd_scene_maps';
const STORAGE_KEY_NARRATION_AUDIO = 'dnd_narration_audio';

/**
 * Scans all campaigns to find which map images are currently in use,
 * then deletes any maps from storage that are not associated with a scene.
 * @returns The number of unused maps that were deleted.
 */
export function cleanupUnusedMaps(): number {
  try {
    const campaignsJSON = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    const mapsJSON = localStorage.getItem(STORAGE_KEY_MAPS);

    if (!mapsJSON) {
      return 0; // Nothing to clean up
    }

    const campaigns: Campaign[] = campaignsJSON ? JSON.parse(campaignsJSON) : [];
    const storedMaps: Record<string, string> = JSON.parse(mapsJSON);

    const usedMapIds = new Set<string>();
    for (const campaign of campaigns) {
      if (campaign.scenes) {
        for (const scene of campaign.scenes) {
            if (scene.background_map_url.startsWith('map_')) {
            usedMapIds.add(scene.background_map_url);
            }
        }
      }
    }

    let deletedCount = 0;
    const cleanedMaps: Record<string, string> = {};
    for (const mapId in storedMaps) {
      if (usedMapIds.has(mapId)) {
        cleanedMaps[mapId] = storedMaps[mapId];
      } else {
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(cleanedMaps));
    }

    return deletedCount;
  } catch (error) {
    console.error("Error during map cleanup:", error);
    return 0;
  }
}

/**
 * Scans all campaigns to find which narration audio clips are currently in use,
 * then deletes any audio from storage that is not associated with a narration.
 * @returns The number of unused audio clips that were deleted.
 */
export function cleanupUnusedNarrations(): number {
  try {
    const campaignsJSON = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    const audioJSON = localStorage.getItem(STORAGE_KEY_NARRATION_AUDIO);

    if (!audioJSON) {
      return 0; // Nothing to clean up
    }

    const campaigns: Campaign[] = campaignsJSON ? JSON.parse(campaignsJSON) : [];
    const storedAudio: Record<string, string> = JSON.parse(audioJSON);

    const usedAudioIds = new Set<string>();
    for (const campaign of campaigns) {
      if (campaign.scenes) {
        for (const scene of campaign.scenes) {
            if (scene.narrations) {
                for (const narration of scene.narrations) {
                    if (narration.audioId) {
                        usedAudioIds.add(narration.audioId);
                    }
                }
            }
        }
      }
    }

    let deletedCount = 0;
    const cleanedAudio: Record<string, string> = {};
    for (const audioId in storedAudio) {
      if (usedAudioIds.has(audioId)) {
        cleanedAudio[audioId] = storedAudio[audioId];
      } else {
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      localStorage.setItem(STORAGE_KEY_NARRATION_AUDIO, JSON.stringify(cleanedAudio));
    }

    return deletedCount;
  } catch (error) {
    console.error("Error during narration audio cleanup:", error);
    return 0;
  }
}

/**
 * A wrapper function to save the campaigns list to localStorage and then
 * trigger a cleanup of unused assets.
 * @param campaigns The full list of campaigns to save.
 * @returns The number of unused assets that were deleted.
 */
export function saveCampaignsAndCleanup(campaigns: Campaign[]): number {
    try {
        localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
        const mapsCleaned = cleanupUnusedMaps();
        const narrationsCleaned = cleanupUnusedNarrations();
        return mapsCleaned + narrationsCleaned;
    } catch (error) {
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            // Re-throw the specific error so components can handle it with a toast.
            throw error;
        }
        console.error("Failed to save campaigns:", error);
        return 0;
    }
}
