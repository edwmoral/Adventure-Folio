'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { generateNarrationAction } from '@/app/play/[id]/board/actions';
import { Sparkles } from 'lucide-react';

const AVAILABLE_VOICES = [
    { name: "Jennifer (Clair Obscur)", id: "Algenib" },
    { name: "Antares (Male)", id: "Antares" },
    { name: "Deneb (Male)", id: "Deneb" },
    { name: "Vega (Female)", id: "Vega" },
];

export function NarrationModule() {
    const { toast } = useToast();
    const [plotSummary, setPlotSummary] = useState('');
    const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0].id);
    const [isGenerating, startTransition] = useTransition();
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const handleGenerate = () => {
        if (!plotSummary.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a plot summary.' });
            return;
        }

        startTransition(async () => {
            setAudioUrl(null);
            const result = await generateNarrationAction({
                plotSummary,
                voice: selectedVoice,
            });

            if (result.success && result.audioUrl) {
                setAudioUrl(result.audioUrl);
                toast({ title: 'Narration Ready!', description: 'Your epic narration has been generated.' });
            } else {
                toast({ variant: 'destructive', title: 'Generation Failed', description: result.error });
            }
        });
    };

    return (
        <div className="h-full flex flex-col p-4 gap-4">
            <div className="space-y-2">
                <Label htmlFor="plot-summary">Plot Summary</Label>
                <Textarea 
                    id="plot-summary"
                    placeholder="e.g., The adventurers enter the ancient tomb, unaware of the lurking danger."
                    value={plotSummary}
                    onChange={(e) => setPlotSummary(e.target.value)}
                    className="h-32"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="voice-select">Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger id="voice-select">
                        <SelectValue placeholder="Select a voice..." />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_VOICES.map(voice => (
                            <SelectItem key={voice.id} value={voice.id}>
                                {voice.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : <><Sparkles className="mr-2 h-4 w-4" /> Generate Narration</>}
            </Button>
            {audioUrl && (
                <div className="mt-4">
                     <audio controls autoPlay className="w-full">
                        <source src={audioUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
             <div className="flex-1" />
            <p className="text-xs text-muted-foreground text-center">
                The AI will first rewrite your summary for dramatic effect before generating the audio.
            </p>
        </div>
    );
}
