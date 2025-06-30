import { Button } from "@/components/ui/button";
import { ArrowLeft, ZoomIn, ZoomOut, Grid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockTokens = [
    { id: 'token1', name: 'Eldrin', imageUrl: 'https://placehold.co/48x48.png', x: 20, y: 30 },
    { id: 'token2', name: 'Goblin 1', imageUrl: 'https://placehold.co/48x48.png', x: 60, y: 40 },
    { id: 'token3', name: 'Goblin 2', imageUrl: 'https://placehold.co/48x48.png', x: 65, y: 45 },
];


export default function MapViewPage({ params }: { params: { id: string } }) {
    return (
        <div className="h-[calc(100vh-10rem)] w-full flex flex-col">
            {/* Header Controls */}
            <div className="flex-shrink-0 bg-background/80 backdrop-blur-sm p-2 border-b rounded-t-lg flex items-center justify-between">
                <div>
                     <Button asChild variant="ghost">
                        <Link href={`/play/${params.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Campaign
                        </Link>
                    </Button>
                </div>
                 <h2 className="text-lg font-semibold">Active Scene: The Goblin Cave</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon"><ZoomIn /></Button>
                    <Button variant="outline" size="icon"><ZoomOut /></Button>
                    <Button variant="outline" size="icon"><Grid /></Button>
                </div>
            </div>
            
            {/* Map Area */}
            <div className="flex-grow relative overflow-hidden bg-card-foreground/10 rounded-b-lg">
                <Image
                    src="https://placehold.co/1200x800.png"
                    alt="Fantasy battle map"
                    fill
                    className="object-cover"
                    data-ai-hint="fantasy map"
                />

                {/* Tokens */}
                {mockTokens.map(token => (
                    <div
                        key={token.id}
                        className="absolute group cursor-pointer"
                        style={{
                            left: `${token.x}%`,
                            top: `${token.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                         <Avatar className="h-12 w-12 border-2 border-primary shadow-lg transition-transform group-hover:scale-110">
                            <AvatarImage src={token.imageUrl} data-ai-hint="fantasy character icon" />
                            <AvatarFallback>{token.name.substring(0,1)}</AvatarFallback>
                        </Avatar>
                         <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs px-2 py-0.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {token.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
