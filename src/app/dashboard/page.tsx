import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, Sparkles, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
        Welcome to Adventure Folio
      </h1>
      <p className="max-w-[700px] text-muted-foreground md:text-xl mt-4">
        Your all-in-one companion for creating, managing, and bringing your D&D characters to life.
        Forge your legend today.
      </p>
      
      <Alert className="max-w-2xl mt-8 text-left">
          <Database className="h-4 w-4" />
          <AlertTitle>Now using Cloud Firestore!</AlertTitle>
          <AlertDescription>
              Your data is now saved to a cloud database, accessible from any device. Firestore has a generous free tier, but you can monitor usage and set billing alerts in your Firebase project settings.
          </AlertDescription>
      </Alert>

      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/character/create">Create Your First Character</Link>
        </Button>
      </div>
      <div className="mt-16 grid gap-8 sm:grid-cols-1 md:grid-cols-3 w-full max-w-5xl">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">Effortless Creation</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              A guided, step-by-step process to build your character from the ground up, with all the necessary stats and skills calculated for you.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">AI-Powered Backstories</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Stuck on your character's history? Let our AI generate a rich, compelling background story to spark your imagination.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">Manage Everything</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Keep track of your inventory, spells, and character progression with an intuitive and clean character sheet.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
