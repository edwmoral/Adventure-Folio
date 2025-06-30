import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewCampaignPage() {
  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
             <Link href="/play">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
             </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>
                Give your new adventure a name to get started. You can add more details later.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input id="campaign-name" placeholder="e.g., The Dragon's Demise" />
                </div>
                {/* We'll add image upload later */}
                <div className="flex justify-end">
                    <Button type="submit">Create Campaign</Button>
                </div>
            </form>
        </CardContent>
        </Card>
    </div>
  );
}
