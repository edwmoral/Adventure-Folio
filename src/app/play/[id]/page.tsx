import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data, in a real app this would be fetched based on params.id
const mockCampaign = {
    id: '1',
    name: 'The Sunless Citadel',
    imageUrl: 'https://placehold.co/800x300.png',
    description: 'A classic adventure filled with mystery, danger, and a fortress swallowed by the earth.',
    characters: [
      { id: 'char1', name: 'Eldrin', avatarUrl: 'https://placehold.co/40x40.png' },
      { id: 'char2', name: 'Lyra', avatarUrl: 'https://placehold.co/40x40.png' },
      { id: 'char3', name: 'Borg', avatarUrl: 'https://placehold.co/40x40.png' },
    ],
};


export default function CampaignDetailPage({ params }: { params: { id: string } }) {
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
                        src={mockCampaign.imageUrl}
                        alt={`${mockCampaign.name} banner image`}
                        fill
                        className="object-cover"
                        data-ai-hint="fantasy landscape"
                    />
                </div>
                <CardHeader>
                    <CardTitle className="text-4xl font-headline">{mockCampaign.name}</CardTitle>
                    <CardDescription>{mockCampaign.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Users className="h-5 w-5" />
                            Characters in this Campaign
                        </h3>
                        <div className="flex flex-wrap items-center gap-4">
                            {mockCampaign.characters.map(char => (
                                <div key={char.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card-foreground/5">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={char.avatarUrl} data-ai-hint="fantasy character" />
                                        <AvatarFallback>{char.name.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{char.name}</span>
                                </div>
                            ))}
                             <Button variant="outline" className="h-auto aspect-square p-0 flex flex-col gap-1">
                                <UserPlus className="h-5 w-5" />
                                <span className="text-xs">Add</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                 <Button asChild size="lg">
                    <Link href={`/play/${params.id}/play`}>
                        <Play className="mr-2 h-5 w-5" />
                        Start Session
                    </Link>
                </Button>
            </div>
        </div>
    );
}
