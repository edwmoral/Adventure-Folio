import Link from 'next/link';
import Image from 'next/image';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Character = {
  name: string;
  avatarUrl: string;
};

type CampaignCardProps = {
  campaign: {
    id: string;
    name: string;
    imageUrl: string;
    characters: Character[];
  };
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Link href={`/play/${campaign.id}`} className="block group">
        <Card className="overflow-hidden transition-all duration-200 group-hover:border-primary group-hover:shadow-lg">
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
                    {campaign.characters.map((char, index) => (
                        <Tooltip key={index}>
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
        </Card>
    </Link>
  );
}
