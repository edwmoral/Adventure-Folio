
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Scene, Token, Shape } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Grid, Pointer, Circle, Triangle, Minus, Ruler } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function BattleMap({ scene, selectedTokenId, onTokenSelect, onSceneUpdate }: { scene: Scene, selectedTokenId: string | null, onTokenSelect: (tokenId: string | null) => void, onSceneUpdate: (scene: Scene) => void }) {
    const [resolvedMapUrl, setResolvedMapUrl] = useState('');
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [showGrid, setShowGrid] = useState(true);
    const [draggedToken, setDraggedToken] = useState<{ id: string; startPos: { x: number; y: number } } | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState<{ scene: Scene, description: string } | null>(null);
    
    const [activeTool, setActiveTool] = useState<'pointer' | 'circle' | 'cone' | 'line'>('pointer');
    const [lastUsedTool, setLastUsedTool] = useState<'circle' | 'cone' | 'line'>('circle');
    const [isMeasureToolsOpen, setIsMeasureToolsOpen] = useState(false);
    const [drawingShape, setDrawingShape] = useState<Shape | null>(null);
    
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
        if (e.target !== mapContainerRef.current) return;
        
        // Panning logic (middle mouse button)
        if (e.button === 1) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            return;
        }

        if (e.button === 0 && mapContainerRef.current) {
            if (activeTool === 'pointer') {
                onTokenSelect(null);
            }
            if (activeTool === 'circle' || activeTool === 'cone' || activeTool === 'line') {
                e.preventDefault();
                const containerRect = mapContainerRef.current.getBoundingClientRect();
                const mapX = (e.clientX - containerRect.left - pan.x) / zoom;
                const mapY = (e.clientY - containerRect.top - pan.y) / zoom;
                
                const pointX = (mapX / mapContainerRef.current.offsetWidth) * 100;
                const pointY = (mapY / mapContainerRef.current.offsetHeight) * 100;

                if (activeTool === 'circle') {
                    setDrawingShape({
                        id: `shape-${Date.now()}`,
                        type: 'circle',
                        center: { x: pointX, y: pointY },
                        radius: 0,
                        color: '#ef4444' // A red color for the tool
                    });
                } else if (activeTool === 'cone') {
                     setDrawingShape({
                        id: `shape-${Date.now()}`,
                        type: 'cone',
                        origin: { x: pointX, y: pointY },
                        endPoint: { x: pointX, y: pointY },
                        color: '#ef4444'
                    });
                } else if (activeTool === 'line') {
                    setDrawingShape({
                        id: `shape-${Date.now()}`,
                        type: 'line',
                        start: { x: pointX, y: pointY },
                        end: { x: pointX, y: pointY },
                        color: '#ef4444'
                    });
                }
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning && mapContainerRef.current) {
            e.preventDefault();
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
            return;
        }

        if (drawingShape && mapContainerRef.current) {
            e.preventDefault();
            const containerRect = mapContainerRef.current.getBoundingClientRect();
            const mapWidthPixels = containerRect.width;
            const mapHeightPixels = containerRect.height;

            const mapX = (e.clientX - containerRect.left - pan.x) / zoom;
            const mapY = (e.clientY - containerRect.top - pan.y) / zoom;

            const currentX_pc = (mapX / mapWidthPixels) * 100;
            const currentY_pc = (mapY / mapHeightPixels) * 100;

            if (drawingShape.type === 'circle') {
                const dx_pc = currentX_pc - drawingShape.center.x;
                const dy_pc = currentY_pc - drawingShape.center.y;

                const dx_px = dx_pc / 100 * mapWidthPixels;
                const dy_px = dy_pc / 100 * mapHeightPixels;

                const radius_px = Math.hypot(dx_px, dy_px);
                const radius_pc = (radius_px / mapWidthPixels) * 100;
                
                setDrawingShape(prev => prev?.type === 'circle' ? { ...prev, radius: radius_pc } : null);

            } else if (drawingShape.type === 'cone') {
                setDrawingShape(prev => prev?.type === 'cone' ? { ...prev, endPoint: { x: currentX_pc, y: currentY_pc } } : null);
            } else if (drawingShape.type === 'line') {
                 setDrawingShape(prev => prev?.type === 'line' ? { ...prev, end: { x: currentX_pc, y: currentY_pc } } : null);
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning) {
            setIsPanning(false);
        }
        
        if (drawingShape) {
            const finalShape = { ...drawingShape };
            let description = '';
            let ignore = false;

            if (finalShape.type === 'circle') {
                if (finalShape.radius < 1) { ignore = true; } // Ignore tiny accidental clicks
                else {
                    const mapWidthInFt = (scene.width || 30) * 5;
                    const diameterInFt = ((finalShape.radius / 100) * mapWidthInFt * 2).toFixed(0);
                    description = `Draw a circle with a ${diameterInFt} diameter.`;
                }
            } else if (finalShape.type === 'cone') {
                const dx = finalShape.endPoint.x - finalShape.origin.x;
                const dy = finalShape.endPoint.y - finalShape.origin.y;
                if (Math.hypot(dx, dy) < 1) { ignore = true; }
                else {
                    const mapWidthInFt = (scene.width || 30) * 5;
                    const mapHeightInFt = (scene.height || 20) * 5;
                    const dx_ft = dx / 100 * mapWidthInFt;
                    const dy_ft = dy / 100 * mapHeightInFt;
                    const lengthInFt = Math.hypot(dx_ft, dy_ft).toFixed(0);
                    description = `Draw a cone with a ${lengthInFt} length.`;
                }
            } else if (finalShape.type === 'line') {
                const dx = finalShape.end.x - finalShape.start.x;
                const dy = finalShape.end.y - finalShape.start.y;
                if (Math.hypot(dx, dy) < 1) { ignore = true; }
                else {
                    const mapWidthInFt = (scene.width || 30) * 5;
                    const mapHeightInFt = (scene.height || 20) * 5;
                    const dx_ft = dx / 100 * mapWidthInFt;
                    const dy_ft = dy / 100 * mapHeightInFt;
                    const lengthInFt = Math.hypot(dx_ft, dy_ft).toFixed(0);
                    description = `Draw a line ${lengthInFt} long.`;
                }
            }

            if (!ignore) {
                 setPendingUpdate({
                    scene: { ...scene, shapes: [...(scene.shapes || []), finalShape] },
                    description: description
                });
                setShowConfirm(true);
            }

            setDrawingShape(null);
            setActiveTool('pointer');
        }
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
        if (e.button !== 0 || activeTool !== 'pointer') return;
        e.stopPropagation();
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
        onSceneUpdate({ ...scene, tokens: updatedTokens });
    }

    const handleTokenClick = (e: React.MouseEvent, tokenId: string) => {
        e.stopPropagation();
        if (draggedToken) return;
        onTokenSelect(tokenId);
    }

    const handleTokenMouseUp = (e: React.MouseEvent, tokenId: string) => {
        if (!draggedToken) return;
        setDraggedToken(null);
    }
    
    const confirmAction = () => {
        if (pendingUpdate) {
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

    const renderShape = (shape: Shape) => {
        const borderStrokeWidth = 2.5 / zoom;
        const mainStrokeWidth = 1 / zoom;

        if (shape.type === 'circle') {
            const heightRadius = shape.radius * ((scene.width || 30) / (scene.height || 20));
            return (
                <g key={shape.id}>
                    <ellipse
                        cx={`${shape.center.x}%`}
                        cy={`${shape.center.y}%`}
                        rx={`${shape.radius}%`}
                        ry={`${heightRadius}%`}
                        fill={`${shape.color}4D`}
                        stroke="black"
                        strokeWidth={borderStrokeWidth}
                    />
                    <ellipse
                        cx={`${shape.center.x}%`}
                        cy={`${shape.center.y}%`}
                        rx={`${shape.radius}%`}
                        ry={`${heightRadius}%`}
                        fill="none"
                        stroke={shape.color}
                        strokeWidth={mainStrokeWidth}
                    />
                </g>
            );
        }
        if (shape.type === 'cone') {
            const { origin, endPoint } = shape;
            const dx_pc = endPoint.x - origin.x;
            const dy_pc = endPoint.y - origin.y;
            const map_width_ft = (scene.width || 30) * 5;
            const map_height_ft = (scene.height || 20) * 5;
            const dx_ft = dx_pc / 100 * map_width_ft;
            const dy_ft = dy_pc / 100 * map_height_ft;
            const length_ft = Math.hypot(dx_ft, dy_ft);

            if (length_ft === 0) return null;

            const arc_radius_x_pc = (length_ft / map_width_ft) * 100;
            const arc_radius_y_pc = (length_ft / map_height_ft) * 100;

            const angle = Math.atan2(dy_pc, dx_pc);
            const angle1 = angle - Math.PI / 4;
            const angle2 = angle + Math.PI / 4;

            const p1x = origin.x + arc_radius_x_pc * Math.cos(angle1);
            const p1y = origin.y + arc_radius_y_pc * Math.sin(angle1);
            const p2x = origin.x + arc_radius_x_pc * Math.cos(angle2);
            const p2y = origin.y + arc_radius_y_pc * Math.sin(angle2);

            const pathData = `M ${origin.x},${origin.y} L ${p1x},${p1y} A ${arc_radius_x_pc},${arc_radius_y_pc} 0 0 1 ${p2x},${p2y} Z`;
            
            return (
                <g key={shape.id}>
                    <path d={pathData} fill={`${shape.color}4D`} stroke="black" strokeWidth={borderStrokeWidth} style={{ vectorEffect: 'non-scaling-stroke' }} />
                    <path d={pathData} fill="none" stroke={shape.color} strokeWidth={mainStrokeWidth} style={{ vectorEffect: 'non-scaling-stroke' }} />
                </g>
            )
        }
        if (shape.type === 'line') {
            const { start, end } = shape;
            return (
                <g key={shape.id}>
                     <line
                        x1={`${start.x}%`}
                        y1={`${start.y}%`}
                        x2={`${end.x}%`}
                        y2={`${end.y}%`}
                        stroke="black"
                        strokeWidth={borderStrokeWidth}
                        strokeLinecap="round"
                        style={{ vectorEffect: 'non-scaling-stroke' }}
                    />
                    <line
                        x1={`${start.x}%`}
                        y1={`${start.y}%`}
                        x2={`${end.x}%`}
                        y2={`${end.y}%`}
                        stroke={shape.color}
                        strokeWidth={mainStrokeWidth}
                        strokeLinecap="round"
                        style={{ vectorEffect: 'non-scaling-stroke' }}
                    />
                </g>
            );
        }
        return null;
    }

    const renderShapeLabel = (shape: Shape) => {
        const textStyle: React.CSSProperties = {
            fill: "white",
            stroke: "black",
            strokeWidth: 4 / zoom,
            fontSize: 14 / zoom,
            textAnchor: "middle",
            paintOrder: 'stroke',
            fontWeight: 'bold',
            vectorEffect: 'non-scaling-stroke'
        };

        if (shape.type === 'circle') {
             const mapWidthInFt = (scene.width || 30) * 5;
             const diameter = ((shape.radius / 100) * mapWidthInFt * 2).toFixed(0);
            return (
                <text key={`${shape.id}-label`} x={`${shape.center.x}%`} y={`${shape.center.y}%`} dominantBaseline="middle" {...textStyle}>
                   {diameter}
                </text>
            );
        }
        if (shape.type === 'cone' || shape.type === 'line') {
            const start = shape.type === 'cone' ? shape.origin : shape.start;
            const end = shape.type === 'cone' ? shape.endPoint : shape.end;
            const dx_pc = end.x - start.x;
            const dy_pc = end.y - start.y;
            const map_width_ft = (scene.width || 30) * 5;
            const map_height_ft = (scene.height || 20) * 5;
            const dx_ft = dx_pc / 100 * map_width_ft;
            const dy_ft = dy_pc / 100 * map_height_ft;
            const length_ft = Math.hypot(dx_ft, dy_ft);

            return (
                <text key={`${shape.id}-label`} x={`${(start.x + end.x) / 2}%`} y={`${(start.y + end.y) / 2}%`} dominantBaseline="text-after-edge" dy={-5 / zoom} {...textStyle}>
                   {`${length_ft.toFixed(0)}`}
                </text>
            );
        }
        return null;
    }
    
    const handleToolSelect = (tool: 'circle' | 'cone' | 'line') => {
        setActiveTool(tool);
        setLastUsedTool(tool);
        setIsMeasureToolsOpen(false);
    };

    const handleMeasureButtonClick = () => {
        if (isMeasureToolsOpen) {
            setIsMeasureToolsOpen(false);
            setActiveTool('pointer');
        } else {
            setIsMeasureToolsOpen(true);
            setActiveTool(lastUsedTool);
        }
    };

    const handlePointerSelect = () => {
        setActiveTool('pointer');
        setIsMeasureToolsOpen(false);
    }


    return (
        <div 
            className={cn("w-full h-full relative overflow-hidden bg-muted", activeTool !== 'pointer' && 'cursor-crosshair')}
            ref={mapContainerRef} 
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
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
                    {resolvedMapUrl && <Image src={resolvedMapUrl} alt={scene.name} fill className="object-cover" draggable={false} data-ai-hint="fantasy map" />}
                    {showGrid && <div className="absolute inset-0 pointer-events-none" style={{ backgroundSize: `${100 / (scene.width || 30)}% ${100 / (scene.height || 20)}%`, backgroundImage: 'linear-gradient(to right, hsla(0,0%,100%,0.1) 1px, transparent 1px), linear-gradient(to bottom, hsla(0,0%,100%,0.1) 1px, transparent 1px)' }} />}
                    
                    <div className="absolute inset-0 pointer-events-none">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                            {scene.shapes?.map(shape => renderShape(shape))}
                            {drawingShape && renderShape(drawingShape)}
                            {/* Labels are rendered separately to ensure they are on top */}
                            <g>
                                {scene.shapes?.map(shape => renderShapeLabel(shape))}
                                {drawingShape && renderShapeLabel(drawingShape)}
                            </g>
                        </svg>
                    </div>

                    {scene.tokens.map(token => {
                        const isPlayer = token.type === 'character';
                        const borderColor = isPlayer ? (token.color || 'hsl(var(--primary))') : 'hsl(var(--destructive))';

                        return (
                         <div
                            key={token.id}
                            className={cn(
                                "absolute",
                                activeTool === 'pointer' ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                                selectedTokenId === token.id && "ring-4 ring-yellow-400 rounded-full z-10"
                            )}
                            style={{
                                left: `${token.position.x}%`,
                                top: `${token.position.y}%`,
                                width: `${100 / (scene.width || 30)}%`,
                                height: `${100 / (scene.height || 20)}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
                            onMouseUp={(e) => handleTokenMouseUp(e, token.id)}
                            onClick={(e) => handleTokenClick(e, token.id)}
                         >
                            <Avatar className="h-full w-full border-4 shadow-lg" style={{ borderColor }}>
                                <AvatarImage src={token.imageUrl} className="object-cover" />
                                <AvatarFallback>{token.name.substring(0,1)}</AvatarFallback>
                            </Avatar>
                         </div>
                        )
                    })}
                </div>
            </div>
             <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                {isMeasureToolsOpen && (
                    <div className="flex items-center gap-2 p-1 bg-secondary rounded-md">
                        <Button variant="ghost" size="icon" onClick={() => handleToolSelect('circle')} className={cn(activeTool === 'circle' && 'bg-primary/20 text-primary-foreground')}>
                            <Circle />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToolSelect('cone')} className={cn(activeTool === 'cone' && 'bg-primary/20 text-primary-foreground')}>
                            <Triangle />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToolSelect('line')} className={cn(activeTool === 'line' && 'bg-primary/20 text-primary-foreground')}>
                            <Minus />
                        </Button>
                    </div>
                )}
                 <div className="flex items-center gap-2 p-1 bg-secondary rounded-md">
                    <Button variant="ghost" size="icon" onClick={() => setZoom(z => z * 1.2)}><ZoomIn /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setZoom(z => z / 1.2)}><ZoomOut /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowGrid(g => !g)} className={cn(showGrid && 'bg-primary/20 text-primary-foreground')}><Grid /></Button>
                    <Button variant="ghost" size="icon" onClick={handlePointerSelect} className={cn(activeTool === 'pointer' && 'bg-primary/20 text-primary-foreground')}><Pointer /></Button>
                    <Button variant="ghost" size="icon" onClick={handleMeasureButtonClick} className={cn(isMeasureToolsOpen && 'bg-primary/20 text-primary-foreground')}><Ruler /></Button>
                </div>
            </div>
        </div>
    );
}
