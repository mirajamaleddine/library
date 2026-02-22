import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/lib/routes";

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Placeholder for future settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={PATHS.home} className={buttonVariants({ variant: "outline" })}>
            Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
