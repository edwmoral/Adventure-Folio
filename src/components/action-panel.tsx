
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Heart, Shield, Swords, Footprints } from 'lucide-react';
import type { PlayerCharacter, Enemy, Token, Action } from '@/lib/types';
import { Progress } from './ui/progress';

interface ActionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: Token | null;
  character: PlayerCharacter | null;
  enemy: Enemy | null;
  actions: Action[];
  container?: HTMLElement | null;
}

const StatDisplay = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-card-foreground/5 rounded-lg text-center">
        <div className="text-xl">{icon}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
    </div>
);

const ActionButton = ({ name, description }: { name: string, description: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
                {name}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
            <p className="font-bold">{name}</p>
            <p className="text-muted-foreground">{description}</p>
        </TooltipContent>
    </Tooltip>
);


export function ActionPanel({
  open,
  onOpenChange,
  token,
  character,
  enemy,
  actions,
  container,
}: ActionPanelProps) {

  const data = character || enemy;
  if (!token || !data) {
    return null;
  }
  
  const isPlayer = !!character;

  const health = isPlayer ? character.hp : (token.hp ?? enemy?.hit_points);
  const maxHealth = isPlayer ? character.maxHp : (token.maxHp ?? enemy?.hit_points);
  const healthPercent = ((health || 0) / (maxHealth || 1)) * 100;
  
  const ac = isPlayer ? character.ac : enemy?.armor_class;
  const speed = isPlayer ? '30 ft.' : enemy?.speed; // Assuming base speed for players

  const basePlayerActions = [
      { name: 'Attack', description: 'Make a melee or ranged attack.' },
      { name: 'Dash', description: 'Double your movement speed for the turn.' },
      { name: 'Disengage', description: 'Move without provoking opportunity attacks.' },
      { name: 'Dodge', description: 'Focus on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage.' },
      { name: 'Use an Item', description: 'Interact with an object or item.' },
  ];

  const enemyActions = enemy?.actions
    .split(/(?<=\.)\s+/) // Split on a period followed by a space
    .map(s => s.trim())
    .filter(Boolean)
    .map(actionString => {
        const name = actionString.split('.')[0];
        return { name, description: actionString };
    }) || [];

  const characterActions = [
      ...basePlayerActions,
      ...actions.map(a => ({ name: a.name, description: a.description }))
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-[350px] sm:w-[400px]"
        container={container}
      >
          <TooltipProvider>
        <SheetHeader className="text-left">
          <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                  <AvatarFallback>{token.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-2xl font-headline">{token.name}</SheetTitle>
                <SheetDescription>
                  {isPlayer ? `${character.race} ${character.className}` : `${enemy?.type}`}
                </SheetDescription>
              </div>
          </div>
        </SheetHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>Health</span>
                    <span>{health} / {maxHealth}</span>
                </div>
                <Progress value={healthPercent} className={isPlayer ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"} />
            </div>

            <div className="grid grid-cols-3 gap-2">
                <StatDisplay icon={<Shield />} label="Armor Class" value={ac || 'N/A'} />
                <StatDisplay icon={<Swords />} label="Initiative" value={isPlayer && character.stats ? `+${Math.floor((character.stats.dex - 10) / 2)}` : 'N/A'} />
                <StatDisplay icon={<Footprints />} label="Speed" value={speed || 'N/A'} />
            </div>
            
            <Separator />

            <div className="space-y-2">
                <h4 className="font-semibold">Actions</h4>
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-2 pr-2">
                   {(isPlayer ? characterActions : enemyActions).map((action, index) => (
                       <ActionButton key={`${action.name}-${index}`} name={action.name} description={action.description} />
                   ))}
                </div>
            </div>
        </div>
          </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
}
