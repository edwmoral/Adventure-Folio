import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Book, Dices, Heart, Shield, Swords } from "lucide-react"

const StatCard = ({ name, value, modifier }: { name: string, value: string, modifier: string }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-card-foreground/5 rounded-lg">
        <div className="text-xs text-muted-foreground">{name}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-accent font-medium">{modifier}</div>
    </div>
)

export default function CharacterSheetPage() {
    return (
        <TooltipProvider>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <Avatar className="w-24 h-24 border-4 border-primary">
                        <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="fantasy character" alt="Character Portrait" />
                        <AvatarFallback>EK</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-4xl font-bold font-headline">Eldrin Kael</h1>
                                <p className="text-lg text-muted-foreground">Level 5 Elf Ranger</p>
                            </div>
                            <Button disabled variant="secondary" size="lg" className="mt-4 sm:mt-0">
                                <Dices className="mr-2 h-5 w-5" />
                                Play Session (Coming Soon)
                            </Button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline">Archery</Badge>
                            <Badge variant="outline">Stealth</Badge>
                            <Badge variant="outline">Survival</Badge>
                            <Badge variant="outline">Beast Master</Badge>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Main Content */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Skills */}
                    <div className="md:col-span-1 space-y-8">
                        <Card>
                             <CardHeader>
                                <CardTitle>Ability Scores</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-2">
                                <StatCard name="STR" value="12" modifier="+1" />
                                <StatCard name="DEX" value="18" modifier="+4" />
                                <StatCard name="CON" value="14" modifier="+2" />
                                <StatCard name="INT" value="10" modifier="+0" />
                                <StatCard name="WIS" value="16" modifier="+3" />
                                <StatCard name="CHA" value="8" modifier="-1" />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Vitals & Combat</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-2"><Heart className="text-destructive" /> Hit Points</span>
                                    <span className="font-bold text-lg">42 / 42</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-2"><Shield /> Armor Class</span>
                                    <span className="font-bold text-lg">16</span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-2"><Swords /> Initiative</span>
                                    <span className="font-bold text-lg">+4</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Tabs */}
                    <div className="md:col-span-2">
                        <Tabs defaultValue="inventory" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                                <TabsTrigger value="spells">Spells</TabsTrigger>
                                <TabsTrigger value="features">Features & Traits</TabsTrigger>
                            </TabsList>
                            <TabsContent value="inventory" className="mt-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold">Equipped Items</h3>
                                            <ul className="space-y-2">
                                                <li className="flex items-center justify-between"><span>+1 Longbow</span><Badge>Attuned</Badge></li>
                                                <li className="flex items-center justify-between"><span>Studded Leather Armor</span></li>
                                                <li className="flex items-center justify-between"><span>Boots of Elvenkind</span><Badge>Attuned</Badge></li>
                                            </ul>
                                            <Separator />
                                            <h3 className="font-semibold">Backpack</h3>
                                            <p className="text-sm text-muted-foreground">50 ft. of rope, rations (3 days), waterskin, quiver with 20 arrows...</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="spells" className="mt-4">
                               <Card>
                                    <CardContent className="p-6 text-center">
                                       <Book className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                       <h3 className="font-semibold">Spellbook is empty.</h3>
                                       <p className="text-sm text-muted-foreground">As a Ranger, you might gain spells at a higher level.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="features" className="mt-4">
                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                         <div>
                                            <h4 className="font-semibold">Favored Enemy</h4>
                                            <p className="text-sm text-muted-foreground">You have significant experience studying, tracking, hunting, and even talking to a certain type of enemy (e.g., Orcs).</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Natural Explorer</h4>
                                            <p className="text-sm text-muted-foreground">You are particularly familiar with one type of natural environment and are adept at traveling and surviving in such regions.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
