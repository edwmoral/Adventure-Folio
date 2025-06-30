import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Skill } from '@/lib/types';

const skills: Skill[] = [
  {
    name: "Athletics",
    ability: "Strength",
    description: "Covers climbing, jumping, and swimming. Often used for physical feats requiring brute force."
  },
  {
    name: "Acrobatics",
    ability: "Dexterity",
    description: "Your ability to stay on your feet in a tricky situation, such as when you're trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship's deck."
  },
  {
    name: "Arcana",
    ability: "Intelligence",
    description: "Your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes."
  },
  {
    name: "Deception",
    ability: "Charisma",
    description: "Your ability to convincingly hide the truth, either verbally or through your actions. This can encompass everything from misleading others through ambiguity to telling outright lies."
  },
  {
    name: "Insight",
    ability: "Wisdom",
    description: "Your ability to determine the true intentions of a creature, such as when searching out a lie or predicting someone's next move."
  }
];

export default function SkillsPage() {
  return (
    <div className="space-y-8">
        <h1 className="text-4xl font-bold text-primary font-headline">SKILLS</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {skills.map(skill => (
            <Card key={skill.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{skill.name}</CardTitle>
                  <Badge variant="outline">{skill.ability}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{skill.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}
