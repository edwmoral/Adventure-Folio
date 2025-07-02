
'use client';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatModule() {
    return (
        <div className="h-full flex flex-col p-4 gap-4">
            <div className="flex-1 border rounded-md p-2 overflow-y-auto text-sm space-y-2 bg-muted/50">
                <p><span className="font-bold text-primary">DM:</span> Welcome, adventurers!</p>
                <p><span className="font-bold text-green-400">Eldrin:</span> Greetings! Ready for whatever lies ahead.</p>
                <p><span className="font-bold text-yellow-400">Lyra:</span> Let's find some treasure.</p>
            </div>
            <div className="flex gap-2">
                <Textarea placeholder="Type your message..." className="h-10 resize-none" />
                <Button>Send</Button>
            </div>
        </div>
    )
}
