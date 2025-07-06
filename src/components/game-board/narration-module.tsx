
'use client';

import { useState, useTransition, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { generateNarrationTextAction, generateNarrationAudioAction } from '@/app/play/[id]/board/actions';
import { Sparkles, Trash2, Play, Pause, X } from 'lucide-react';
import type { Narration, PlayerCharacter } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface NarrationModuleProps {
    narrations: Narration[];
    onNarrationCreate: (data: { plotSummary: string; audioUrl: string }) => void;
    onNarrationDelete: (narrationId: string) => void;
    characters: PlayerCharacter[];
}

export function NarrationModule({ narrations, onNarrationCreate, onNarrationDelete, characters }: NarrationModuleProps) {
    const { toast } = useToast();
    const [plotSummary, setPlotSummary] = useState('');
    const [isGeneratingText, startTextTransition] = useTransition();
    const [isGeneratingAudio, startAudioTransition] = useTransition();

    const [epicNarration, setEpicNarration] = useState<string | null>(null);
    const [originalSummaryForAudio, setOriginalSummaryForAudio] = useState('');

    const [activeAudio, setActiveAudio] = useState<{ id: string; url: string } | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleGenerateText = () => {
        if (!plotSummary.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a plot summary.' });
            return;
        }

        startTextTransition(async () => {
            const characterDetails = characters.map(c => ({ name: c.name, race: c.race, className: c.className }));
            const result = await generateNarrationTextAction({ plotSummary, characters: characterDetails });

            if (result.success && result.narrationText) {
                setEpicNarration(result.narrationText);
                setOriginalSummaryForAudio(plotSummary); // Save the original summary
                setPlotSummary(''); // Clear the input
                toast({ title: 'Narration Text Ready!', description: 'Review the text below and generate the audio.' });
            } else {
                toast({ variant: 'destructive', title: 'Text Generation Failed', description: result.error });
            }
        });
    };
    
    const handleGenerateAudio = () => {
        if (!epicNarration) return;
        startAudioTransition(async () => {
            const result = await generateNarrationAudioAction({ narrationText: epicNarration });
            if (result.success && result.audioUrl) {
                onNarrationCreate({ plotSummary: originalSummaryForAudio, audioUrl: result.audioUrl });
                handleCancelEdit();
                toast({ title: 'Audio Generated!', description: 'The new narration is available in the history.' });
            } else {
                 toast({ variant: 'destructive', title: 'Audio Generation Failed', description: result.error });
            }
        });
    };

    const handleCancelEdit = () => {
        setEpicNarration(null);
        setOriginalSummaryForAudio('');
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
            
            {epicNarration !== null ? (
                <div className="space-y-2">
                    <Label htmlFor="epic-narration">Review and Edit Narration</Label>
                    <Textarea 
                        id="epic-narration"
                        value={epicNarration}
                        onChange={(e) => setEpicNarration(e.target.value)}
                        className="h-36"
                    />
                    <div className="flex gap-2">
                        <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="flex-1">
                            {isGeneratingAudio ? 'Generating Audio...' : 'Generate Audio'}
                        </Button>
                        <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="plot-summary">New Narration Summary</Label>
                    <Textarea 
                        id="plot-summary"
                        placeholder="e.g., The adventurers enter the ancient tomb..."
                        value={plotSummary}
                        onChange={(e) => setPlotSummary(e.target.value)}
                        className="h-24"
                    />
                    <Button onClick={handleGenerateText} disabled={isGeneratingText} className="w-full">
                        {isGeneratingText ? 'Generating Text...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Narration Text</>}
                    </Button>
                </div>
            )}
            
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
