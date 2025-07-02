
'use client';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MoveHorizontal } from "lucide-react";

interface MenuModuleProps {
    onTogglePosition: () => void;
    currentPosition: 'left' | 'right';
}

export function MenuModule({ onTogglePosition, currentPosition }: MenuModuleProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold">Game Settings</h3>
                <Button variant="outline" className="w-full">Manage Session</Button>
            </div>
             <div className="space-y-2">
                <h3 className="font-semibold">Modules</h3>
                <Button variant="outline" className="w-full">Import Module</Button>
            </div>
             <div className="space-y-2">
                <h3 className="font-semibold">Interface</h3>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="panel-position" className="flex items-center gap-2">
                        <MoveHorizontal className="h-5 w-5" />
                        <span>Panel Position</span>
                    </Label>
                    <div className="flex items-center gap-2 text-sm">
                        <span>Left</span>
                        <Switch
                            id="panel-position"
                            checked={currentPosition === 'right'}
                            onCheckedChange={onTogglePosition}
                        />
                        <span>Right</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
