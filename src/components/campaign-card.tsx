import Link from 'next/link';
import Image from 'next/image';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Campaign } from '@/lib/types';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';


type CampaignCardProps = {
  campaign: Campaign;
  onDelete: () => void;
};

export function CampaignCard({ campaign, onDelete }: CampaignCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:border-primary hover:shadow-lg group">
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete campaign</span>
      </Button>
      <Link href={`/play/${campaign.id}`} className="block">
        <div className="relative h-40 w-full">
            <Image
                src={campaign.imageUrl}
                alt={`${campaign.name} banner image`}
                fill
                className="object-cover"
                data-ai-hint="fantasy landscape"
            />
        </div>
        <CardHeader>
            <CardTitle className="truncate">{campaign.name}</CardTitle>
        </CardHeader>
        <CardFooter>
            <div className="flex -space-x-2 overflow-hidden">
                <TooltipProvider delayDuration={100}>
                    {campaign.characters.map((char) => (
                        <Tooltip key={char.id}>
                            <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border-2 border-background">
                                    <AvatarImage src={char.avatarUrl} data-ai-hint="fantasy character" />
                                    <AvatarFallback>{char.name.substring(0, 1)}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{char.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
