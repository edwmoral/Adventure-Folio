import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Feat } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const feats: Feat[] = [
  {
    name: "Sharpshooter",
    prerequisites: ["Proficiency with ranged weapons"],
    description: "You can make attacks at long range without disadvantage, and your ranged attacks ignore half and three-quarters cover. Before you make an attack, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the damage.",
    effects: [
      "Ignore cover",
      "+10 damage at -5 accuracy",
      "No disadvantage at long range"
    ]
  },
  {
    name: "Tough",
    prerequisites: [],
    description: "Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.",
    effects: [
      "+2 HP per level"
    ]
  },
  {
    name: "Great Weapon Master",
    prerequisites: ["Proficiency with a melee weapon"],
    description: "On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action. Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack's damage.",
    effects: [
      "Bonus action attack on critical or kill",
      "+10 damage at -5 accuracy with heavy weapons"
    ]
  }
];

export default function FeaturesPage() {
  return (
    <div className="space-y-8">
        <h1 className="text-4xl font-bold text-primary font-headline">FEATS</h1>
        <div className="space-y-6">
          {feats.map(feat => (
            <Card key={feat.name}>
              <CardHeader>
                <CardTitle>{feat.name}</CardTitle>
                {feat.prerequisites.length > 0 && (
                  <CardDescription>
                    Prerequisites: {feat.prerequisites.join(', ')}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{feat.description}</p>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Effects:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {feat.effects.map(effect => (
                      <li key={effect}>{effect}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}
