import { ModeToggle } from "@/components/theme/ModeToggle";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your interface and application preferences.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Select the theme for the dashboard.
                </p>
              </div>
              <ModeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
