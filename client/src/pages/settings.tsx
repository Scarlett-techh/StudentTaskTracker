import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, Shield, Palette, Save } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const SettingsPage = () => {
  const { toast } = useToast();
  const [isChanged, setIsChanged] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    name: "",
    username: "",
    email: ""
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    onSuccess: (data) => {
      if (data) {
        setAccountInfo({
          name: data.name || "",
          username: data.username || "",
          email: data.email || ""
        });

        // Initialize settings from user data if available
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    }
  });

  const [settings, setSettings] = useState({
    notifications: true,
    emailReminders: true,
    darkMode: false,
    autoSave: true,
  });

  // Apply dark mode theme when setting changes
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [settings.darkMode]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      // Combine account info and settings
      const updateData = {
        name: accountInfo.name,
        username: accountInfo.username,
        email: accountInfo.email,
        settings: newSettings
      };

      const response = await apiRequest('PATCH', '/api/user', updateData);

      // Check if response is JSON
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON response, got ${contentType}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully!",
      });
      setIsChanged(false);
    },
    onError: (error: Error) => {
      console.error("Mutation Error:", error);

      let errorMessage = "Failed to update settings. Please try again.";

      // Provide more specific error messages based on the error
      if (error.message.includes("Expected JSON response")) {
        errorMessage = "Server responded with an unexpected format. Please contact support.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsChanged(true);
  };

  const handleAccountInfoChange = (key: string, value: string) => {
    setAccountInfo(prev => ({ ...prev, [key]: value }));
    setIsChanged(true);
  };

  const handleSaveSettings = () => {
    // Basic validation
    if (!accountInfo.email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate(settings);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <>
      <Helmet>
        <title>Settings - Student Task Tracker</title>
        <meta 
          name="description" 
          content="Customize your learning experience with personal settings and preferences."
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account and learning preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={accountInfo.name}
                    onChange={(e) => handleAccountInfoChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={accountInfo.username}
                    onChange={(e) => handleAccountInfoChange('username', e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={accountInfo.email}
                  onChange={(e) => handleAccountInfoChange('email', e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Download Data
              </Button>
              <Separator />
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Preferences
            </CardTitle>
            <CardDescription>
              Customize how you receive updates and reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Push Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications for task updates
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailReminders">Email Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get email reminders for due tasks
                    </p>
                  </div>
                  <Switch
                    id="emailReminders"
                    checked={settings.emailReminders}
                    onCheckedChange={(checked) => handleSettingChange('emailReminders', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoSave">Auto-save Tasks</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically save task changes
                    </p>
                  </div>
                  <Switch
                    id="autoSave"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="darkMode">Dark Mode</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use dark theme for better focus
                    </p>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                  />
                </div>
              </div>
            </div>

            {isChanged && (
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateSettingsMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SettingsPage;