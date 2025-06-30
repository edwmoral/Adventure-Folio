import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SkillsPage() {
  return (
    <div className="space-y-8">
        <h1 className="text-4xl font-bold text-primary font-headline">SKILLS</h1>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This section is under construction. Soon you'll be able to manage all D&D skills here.</p>
            </CardContent>
        </Card>
    </div>
  );
}
