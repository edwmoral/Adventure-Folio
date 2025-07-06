
'use client';

import { useState, useTransition, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { generateNarrationAction } from '@/app/play/[id]/board/actions';
import { Sparkles, Trash2, Play, Pause } from 'lucide-react';
import type { Narration } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface NarrationModuleProps {
    narrations: Narration[];
    onNarrationCreate: (data: { plotSummary: string; audioUrl: string }) => void;
    onNarrationDelete: (narrationId: string) => void;
}

export function NarrationModule({ narrations, onNarrationCreate, onNarrationDelete }: NarrationModuleProps) {
    const { toast } = useToast();
    const [plotSummary, setPlotSummary] = useState('');
    const [isGenerating, startTransition] = useTransition();
    const [activeAudio, setActiveAudio] = useState<{ id: string; url: string } | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleGenerate = () => {
        if (!plotSummary.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a plot summary.' });
            return;
        }

        startTransition(async () => {
            const result = await generateNarrationAction({ plotSummary });

            if (result.success && result.narration) {
                onNarrationCreate(result.narration);
                setPlotSummary('');
                toast({ title: 'Narration Ready!', description: 'Your epic narration has been generated.' });
            } else {
                toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
            }
        });
    };
    
    const handlePlayPause = (narration: Narration) => {
        if (activeAudio?.id === narration.id) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setActiveAudio(null);
        } else {
            setActiveAudio({ id: narration.id, url: narration.audioUrl });
        }
    };

    return (
        <div className="h-full flex flex-col p-4 gap-4">
             {activeAudio && (
                <audio
                    ref={audioRef}
                    key={activeAudio.id} 
                    src={activeAudio.url}
                    autoPlay
                    onEnded={() => setActiveAudio(null)}
                    className="hidden"
                />
            )}
            <div className="space-y-2">
                <Label htmlFor="plot-summary">New Narration Summary</Label>
                <Textarea 
                    id="plot-summary"
                    placeholder="e.g., The adventurers enter the ancient tomb..."
                    value={plotSummary}
                    onChange={(e) => setPlotSummary(e.target.value)}
                    className="h-24"
                />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Narration</>}
            </Button>
            
            <div className="flex-1 flex flex-col min-h-0">
                <Label className="mb-2">Narration History</Label>
                <ScrollArea className="border rounded-md flex-1">
                    <div className="p-2 space-y-2">
                    {narrations && narrations.length > 0 ? (
                        [...narrations].reverse().map(narration => (
                            <div key={narration.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePlayPause(narration)}>
                                    {activeAudio?.id === narration.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                <p className="text-sm flex-1 truncate" title={narration.plotSummary}>{narration.plotSummary}</p>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onNarrationDelete(narration.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-muted-foreground p-4">No narrations generated for this scene yet.</p>
                    )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
