
'use client';

import { GameBoard } from "@/components/game-board/game-board";
import { useParams } from 'next/navigation';

export default function GameBoardPage() {
    const params = useParams();
    const id = params.id as string;

    if (!id) {
        return null;
    }

    return <GameBoard campaignId={id} />;
}
