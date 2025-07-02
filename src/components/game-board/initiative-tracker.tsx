
'use client';

import type { Combatant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InitiativeTrackerProps {
  combatants: Combatant[];
  activeTurnIndex: number;
}

export function InitiativeTracker({ combatants, activeTurnIndex }: InitiativeTrackerProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex justify-center items-center gap-2 bg-background/50 backdrop-blur-sm p-2 rounded-lg max-w-max mx-auto pointer-events-auto">
            <TooltipProvider>
                {combatants.map((c, index) => (
                    <Tooltip key={c.tokenId}>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                <Avatar className={cn(
                                    'h-12 w-12 border-2 transition-all duration-300',
                                    index === activeTurnIndex ? 'border-green-400 scale-110' : 'border-muted'
                                )}>
                                    <AvatarImage src={c.avatarUrl} />
                                    <AvatarFallback>{c.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                 <div className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border border-black/50">
                                    {c.initiative}
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-bold">{c.name}</p>
                            <p>Initiative: {c.initiative}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    </div>
  );
}
