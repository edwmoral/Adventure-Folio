
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText } from 'lucide-react';

export default function NarrationsPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="max-w-md">
        <Card>
            <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <BookText className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle>Narrations</CardTitle>
                <CardDescription>
                    This feature is coming soon.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Soon you'll be able to manage your AI-generated narrations and voice clips here.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
