
'use client';

import type { Token } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Dices } from 'lucide-react';

interface TurnOrderTrackerProps {
  turnOrder: (Token & { initiative: number })[];
  activeTokenIndex: number;
  roundNumber: number;
}

export function TurnOrderTracker({ turnOrder, activeTokenIndex, roundNumber }: TurnOrderTrackerProps) {
  if (turnOrder.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-20">
      <Card className="w-64 bg-background/80 backdrop-blur-sm">
        <CardHeader className="p-4">
          <CardTitle className="flex justify-between items-center">
            <span>Initiative</span>
            <span className="text-sm font-medium text-muted-foreground">Round {roundNumber}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
          <ul className="space-y-1 p-2">
            {turnOrder.map((token, index) => (
              <li
                key={token.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md transition-all",
                  index === activeTokenIndex ? 'bg-primary/20 border border-primary' : 'bg-card-foreground/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                    <AvatarFallback>{token.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{token.name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold">
                    <Dices className="h-3 w-3 text-muted-foreground" />
                    <span>{token.initiative}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
