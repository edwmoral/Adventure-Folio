
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Scene, Token } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Grid, Pointer } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';

export function BattleMap({ scene, onSceneUpdate }: { scene: Scene, onSceneUpdate: (scene: Scene) => void }) {
    const [resolvedMapUrl, setResolvedMapUrl] = useState('');
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [showGrid, setShowGrid] = useState(true);
    const [draggedToken, setDraggedToken] = useState<{ id: string; startPos: { x: number; y: number } } | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState<{ scene: Scene, description: string } | null>(null);
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        let mapUrl = scene.background_map_url;
        if (mapUrl.startsWith('map_')) {
            try {
                const mapsJSON = localStorage.getItem('dnd_scene_maps');
                const maps = mapsJSON ? JSON.parse(mapsJSON) : {};
                setResolvedMapUrl(maps[mapUrl] || 'https://placehold.co/1200x800.png');
            } catch (e) {
                setResolvedMapUrl('https://placehold.co/1200x800.png');
            }
        } else {
            setResolvedMapUrl(mapUrl);
        }
    }, [scene.background_map_url]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 1) return; // Middle mouse for panning
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPanning || !mapContainerRef.current) return;
        e.preventDefault();
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsPanning(false);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (!mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        const scrollDelta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.2, Math.min(5, zoom + scrollDelta * zoom));
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const mapX = (mouseX - pan.x) / zoom;
        const mapY = (mouseY - pan.y) / zoom;
        
        const newPanX = mouseX - mapX * newZoom;
        const newPanY = mouseY - mapY * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
    };

    const handleTokenMouseDown = (e: React.MouseEvent, tokenId: string) => {
        if (e.button !== 0) return;
        const token = scene.tokens.find(t => t.id === tokenId);
        if (token) {
            setDraggedToken({ id: tokenId, startPos: token.position });
        }
    }
    
    const handleMapMouseMoveForDrag = (e: React.MouseEvent) => {
        if (!draggedToken || !mapContainerRef.current) return;
        
        const containerRect = mapContainerRef.current.getBoundingClientRect();
        const mapX = (e.clientX - containerRect.left - pan.x) / zoom;
        const mapY = (e.clientY - containerRect.top - pan.y) / zoom;
        
        const newXPercent = (mapX / mapContainerRef.current.offsetWidth) * 100;
        const newYPercent = (mapY / mapContainerRef.current.offsetHeight) * 100;

        const updatedTokens = scene.tokens.map(token => 
            token.id === draggedToken.id 
                ? { ...token, position: { x: newXPercent, y: newYPercent } } 
                : token
        );
        // This creates a temporary state for the GM's view while dragging
        onSceneUpdate({ ...scene, tokens: updatedTokens });
    }

    const handleTokenMouseUp = (e: React.MouseEvent, tokenId: string) => {
        if (!draggedToken) return;

        const startPos = draggedToken.startPos;
        const endToken = scene.tokens.find(t => t.id === tokenId);
        if (!endToken) return;

        const description = `Move ${endToken.name} token.`;
        setPendingUpdate({
            scene: { ...scene, tokens: scene.tokens.map(t => t.id === tokenId ? { ...t, position: endToken.position } : t) },
            description: description
        });

        // Revert UI change until confirmed
        const revertedTokens = scene.tokens.map(t => t.id === tokenId ? {...t, position: startPos} : t);
        onSceneUpdate({...scene, tokens: revertedTokens});
        
        setShowConfirm(true);
        setDraggedToken(null);
    }
    
    const confirmAction = () => {
        if (pendingUpdate) {
            // Apply the final state and "sync" it
            onSceneUpdate(pendingUpdate.scene);
            toast({ title: 'Action Confirmed', description: pendingUpdate.description });
        }
        setShowConfirm(false);
        setPendingUpdate(null);
    }

    const cancelAction = () => {
        setShowConfirm(false);
        setPendingUpdate(null);
        toast({ title: 'Action Cancelled' });
    }

    return (
        <div 
            className="w-full h-full relative overflow-hidden bg-muted" 
            ref={mapContainerRef} 
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            onWheel={handleWheel} 
            onMouseLeave={handleMouseUp} 
            onMouseMoveCapture={handleMapMouseMoveForDrag}
        >
             <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to perform this action? This will be synced to all players.
                            <p className="font-bold mt-2">{pendingUpdate?.description}</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelAction}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="absolute top-0 left-0 w-full h-full" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                <div className="relative w-full h-full bg-gray-700" style={{ aspectRatio: `${scene.width || 30}/${scene.height || 20}` }}>
                    {resolvedMapUrl && <Image src={resolvedMapUrl} alt={scene.name} fill className="object-cover" draggable={false} />}
                    {showGrid && <div className="absolute inset-0 pointer-events-none" style={{ backgroundSize: `${100 / (scene.width || 30)}% ${100 / (scene.height || 20)}%`, backgroundImage: 'linear-gradient(to right, hsla(0,0%,100%,0.1) 1px, transparent 1px), linear-gradient(to bottom, hsla(0,0%,100%,0.1) 1px, transparent 1px)' }} />}
                    
                    {scene.tokens.map(token => (
                         <div
                            key={token.id}
                            className="absolute cursor-grab active:cursor-grabbing"
                            style={{
                                left: `${token.position.x}%`,
                                top: `${token.position.y}%`,
                                width: `${100 / (scene.width || 30)}%`,
                                height: `${100 / (scene.height || 20)}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
                            onMouseUp={(e) => handleTokenMouseUp(e, token.id)}
                         >
                            <Avatar className="h-full w-full border-2 border-red-500 shadow-lg">
                                <AvatarImage src={token.imageUrl} className="object-cover" />
                                <AvatarFallback>{token.name.substring(0,1)}</AvatarFallback>
                            </Avatar>
                         </div>
                    ))}
                </div>
            </div>
             <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button variant="secondary" size="icon" onClick={() => setZoom(z => z * 1.2)}><ZoomIn /></Button>
                <Button variant="secondary" size="icon" onClick={() => setZoom(z => z / 1.2)}><ZoomOut /></Button>
                <Button variant="secondary" size="icon" onClick={() => setShowGrid(g => !g)}><Grid /></Button>
                <Button variant="secondary" size="icon"><Pointer /></Button>
            </div>
        </div>
    );
}
