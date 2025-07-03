
'use client';

import { useMemo } from 'react';
import type { Combatant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InitiativeTrackerProps {
  combatants: Combatant[];
  activeTurnIndex: number;
}

export function InitiativeTracker({ combatants, activeTurnIndex }: InitiativeTrackerProps) {
  const reorderedCombatants = useMemo(() => {
    return [...combatants.slice(activeTurnIndex), ...combatants.slice(0, activeTurnIndex)];
  }, [combatants, activeTurnIndex]);

  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10 p-2 bg-transparent pointer-events-none">
        <div className="flex flex-col items-center gap-3 bg-background/50 backdrop-blur-sm p-2 rounded-lg pointer-events-auto">
            <TooltipProvider>
                {reorderedCombatants.map((c, index) => {
                    const isActive = index === 0;
                    return (
                    <Tooltip key={c.tokenId}>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                <Avatar className={cn(
                                    'h-14 w-14 border-4 transition-all duration-300',
                                    isActive ? 'border-green-400 scale-110' : 'border-muted scale-90 opacity-70'
                                )}>
                                    <AvatarImage src={c.avatarUrl} />
                                    <AvatarFallback>{c.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                 <div className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border border-black/50">
                                    {c.initiative}
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p className="font-bold">{c.name}</p>
                            <p>Initiative: {c.initiative}</p>
                        </TooltipContent>
                    </Tooltip>
                )})}
            </TooltipProvider>
        </div>
    </div>
  );
}
