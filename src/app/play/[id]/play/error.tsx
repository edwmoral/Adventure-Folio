
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full">
        <Card className="max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle>Something Went Wrong</CardTitle>
                <CardDescription>
                    We encountered an unexpected error while trying to load your session. Please try again.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                    <strong>Error:</strong> {error.message}
                </p>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => reset()}>
                        Try Again
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/play">Back to Campaigns</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
