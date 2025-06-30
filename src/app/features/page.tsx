import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeaturesPage() {
  return (
    <div className="space-y-8">
        <h1 className="text-4xl font-bold text-primary font-headline">FEATURES</h1>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This section is under construction. Soon you'll be able to manage all class and racial features here.</p>
            </CardContent>
        </Card>
    </div>
  );
}
