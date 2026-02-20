import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiStatusCard } from "@/features/system/ApiStatusCard";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Home</h1>
        <p className="mt-1 text-muted-foreground">Welcome to the Assessment App scaffold.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              This scaffold includes React Router, shadcn/ui components, Tailwind CSS, and a typed
              API client. Add your features in <code className="text-xs">src/features/</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>

        <ApiStatusCard />
      </div>
    </div>
  );
}
