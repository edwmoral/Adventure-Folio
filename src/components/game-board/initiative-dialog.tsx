
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Scene, PlayerCharacter, Enemy, Combatant, Token } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dices } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InitiativeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  scene: Scene;
  allPlayerCharacters: PlayerCharacter[];
  allEnemies: Enemy[];
  onCombatStart: (combatants: Combatant[]) => void;
}

type InitiativeEntry = {
  tokenId: string;
  name: string;
  avatarUrl: string;
  dexterityModifier: number;
  initiative: number | '';
};

const getDexModifier = (score: number) => Math.floor((score - 10) / 2);

export function InitiativeDialog({ isOpen, onOpenChange, scene, allPlayerCharacters, allEnemies, onCombatStart }: InitiativeDialogProps) {
  const [initiativeEntries, setInitiativeEntries] = useState<InitiativeEntry[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen && scene) {
      const entries = scene.tokens.map(token => {
        let name = token.name;
        let dexterityModifier = 0;
        let avatarUrl = token.imageUrl;

        if (token.type === 'character' && token.linked_character_id) {
          const char = allPlayerCharacters.find(c => c.id === token.linked_character_id);
          if (char) {
            name = char.name;
            dexterityModifier = getDexModifier(char.stats.dex);
            avatarUrl = char.avatar;
          }
        } else if ((token.type === 'monster' || token.type === 'npc') && token.linked_enemy_id) {
          const enemy = allEnemies.find(e => e.id === token.linked_enemy_id);
          if (enemy) {
            name = enemy.name;
            dexterityModifier = getDexModifier(enemy.dex);
            avatarUrl = enemy.tokenImageUrl || token.imageUrl;
          }
        }
        return { tokenId: token.id, name, avatarUrl, dexterityModifier, initiative: '' };
      });
      setInitiativeEntries(entries);
    }
  }, [isOpen, scene, allPlayerCharacters, allEnemies]);
  
  const handleRollInitiative = (tokenId: string) => {
    const entry = initiativeEntries.find(e => e.tokenId === tokenId);
    if (!entry) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    const totalInitiative = roll + entry.dexterityModifier;
    
    setInitiativeEntries(prev => prev.map(e => e.tokenId === tokenId ? { ...e, initiative: totalInitiative } : e));
  };
  
  const handleInitiativeChange = (tokenId: string, value: string) => {
    const numericValue = value === '' ? '' : parseInt(value);
    if (value === '' || (!isNaN(numericValue) && numericValue >= -10 && numericValue <= 40)) {
        setInitiativeEntries(prev => prev.map(e => e.tokenId === tokenId ? { ...e, initiative: numericValue } : e));
    }
  };
  
  const handleBeginCombat = () => {
    const allSet = initiativeEntries.every(e => e.initiative !== '');
    if (!allSet) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please set initiative for all combatants.' });
        return;
    }
    
    const finalCombatants: Combatant[] = initiativeEntries
      .map(e => ({
        tokenId: e.tokenId,
        name: e.name,
        avatarUrl: e.avatarUrl,
        dexterityModifier: e.dexterityModifier,
        initiative: e.initiative as number,
      }))
      .sort((a, b) => {
        if (b.initiative === a.initiative) {
          return b.dexterityModifier - a.dexterityModifier; // Tie-breaker
        }
        return b.initiative - a.initiative;
      });
      
    onCombatStart(finalCombatants);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Roll for Initiative!</DialogTitle>
          <DialogDescription>
            Enter or roll initiative for each combatant to begin the battle.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
                {initiativeEntries.map(entry => (
                    <div key={entry.tokenId} className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback>{entry.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">DEX Mod: {entry.dexterityModifier >= 0 ? `+${entry.dexterityModifier}` : entry.dexterityModifier}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Input 
                                type="number" 
                                className="w-20 text-center" 
                                value={entry.initiative}
                                onChange={(e) => handleInitiativeChange(entry.tokenId, e.target.value)}
                                placeholder="Roll"
                            />
                            <Button variant="outline" size="icon" onClick={() => handleRollInitiative(entry.tokenId)}>
                                <Dices className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleBeginCombat}>Begin Combat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
