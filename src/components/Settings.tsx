import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsProps {
  userRoles: string[];
}

const Settings: React.FC<SettingsProps> = ({ userRoles }) => {
  // Only show settings if user is super_admin
  if (!userRoles.includes('super_admin')) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>
          Configure platform-wide settings and commission rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="font-medium text-purple-900">Super Admin Access</p>
            <p className="text-sm text-purple-700 mt-1">
              You have full control over commission rates and platform settings.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Commission and platform settings interface coming soon...
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;
