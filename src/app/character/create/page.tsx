import { CharacterCreationForm } from '@/components/character-creation-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateCharacterPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Character Forge</CardTitle>
          <CardDescription>
            Bring your hero to life. Fill in the details below, or use our AI to help craft the perfect backstory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CharacterCreationForm />
        </CardContent>
      </Card>
    </div>
  );
}
