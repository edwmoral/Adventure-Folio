
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { getUserDoc, saveUserDoc } from "@/lib/firestore";

const ACTION_TYPES = ['Action', 'Bonus Action', 'Reaction', 'Legendary', 'Lair'].sort();
const USAGE_TYPES = ['At Will', 'Per Turn', 'Per Round', 'Recharge', 'Per Day'].sort();

export default function EditActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const actionNameParam = searchParams.get('name');
  const [isLoading, setIsLoading] = useState(true);
  
  const [action, setAction] = useState<Partial<Action>>({
      name: '',
      type: 'Action',
      action_type: 'Standard',
      description: '',
      usage: { type: 'At Will' },
      effects: ''
  });

  useEffect(() => {
    if (user && actionNameParam) {
      setIsLoading(true);
      const fetchAction = async () => {
        try {
          const foundAction = await getUserDoc<Action>('actions', actionNameParam);
          if (foundAction) {
            setAction(foundAction);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Action not found.' });
            router.push('/actions');
          }
        } catch (error) {
          console.error("Failed to load action:", error);
          toast({ variant: "destructive", title: "Load Failed", description: "Could not load action data." });
        } finally {
          setIsLoading(false);
        }
      };
      fetchAction();
    } else if (!actionNameParam) {
        // If there's no param, it's an invalid state, so stop loading and let user go back
        setIsLoading(false);
    }
  }, [actionNameParam, router, toast, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setAction(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Action, value: string) => {
    setAction(prev => ({ ...prev, [id]: value }));
  };
  
  const handleUsageChange = (field: 'type' | 'limit', value: string | number) => {
      setAction(prev => ({
          ...prev,
          usage: { ...prev.usage, [field]: value } as Action['usage']
      }));
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
    }
    if (!action.name || !action.description) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name and Description are required.' });
        return;
    }

    if (!actionNameParam) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot update action without its original identifier.' });
        return;
    }
    
    try {
        const updatedAction: Action = {
            name: action.name!,
            type: action.type || 'Action',
            action_type: action.action_type || 'Standard',
            description: action.description!,
            usage: action.usage || { type: 'At Will' },
            effects: action.effects
        };
        
        // We use actionNameParam as the ID to update the correct doc, even if the name changed.
        await saveUserDoc('actions', actionNameParam, updatedAction);

        toast({ title: "Action Updated!", description: "The action has been successfully updated." });
        router.push(`/actions`);

    } catch (error) {
        console.error("Failed to update action:", error);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update the action." });
    }
  }

  if (isLoading) {
    return <div className="text-center p-8">Loading action data...</div>;
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/actions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Actions
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Edit Action</CardTitle>
                <CardDescription>
                    Update the details for the action "{actionNameParam}".
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Action Name</Label>
                            <Input id="name" value={action.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Action Type</Label>
                            <Select value={action.type} onValueChange={(val) => handleSelectChange('type', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={action.description} onChange={handleInputChange} required />
                    </div>
                     <div className="border p-4 rounded-md space-y-4">
                        <h4 className="font-medium">Usage</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="usage-type">Frequency</Label>
                                <Select value={action.usage?.type} onValueChange={(val) => handleUsageChange('type', val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {USAGE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="usage-limit">Limit / Recharge</Label>
                                <Input id="usage-limit" value={action.usage?.limit || ''} onChange={(e) => handleUsageChange('limit', e.target.value)} placeholder="e.g., 3 or 5-6" />
                            </div>
                         </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="effects">Effects</Label>
                        <Textarea id="effects" value={action.effects} onChange={handleInputChange} placeholder="Describe the mechanical effects, such as damage rolls, conditions, etc. For complex actions like multi-attack, a more advanced editor may be needed."/>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
