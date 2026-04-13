import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, LogOut, Shield, User, BellRing, Mail, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserSchema.partial().omit({ password: true })),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      emergencyContact1: user?.emergencyContact1 || "",
      emergencyContact2: user?.emergencyContact2 || "",
      preferSafestRoute: user?.preferSafestRoute ?? true,
      allowRealTimeUpdates: user?.allowRealTimeUpdates ?? true,
    },
  });

  const handleLogout = async () => {
    await logout.mutateAsync();
    setLocation("/auth");
  };

  const onSubmit = async (data: any) => {
    try {
      await apiRequest("PATCH", "/api/user", data);
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "There was an error saving your changes.",
      });
    }
  };

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-sm mb-6">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4 ring-4 ring-primary/10">
            <AvatarFallback className="text-2xl font-display font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-display font-bold text-foreground">{user.fullName}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      <div className="px-4 max-w-md mx-auto space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </CardTitle>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="emergencyContact1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Contact</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Contact</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Safety Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="preferSafestRoute"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4 bg-white">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Prefer Safest Route</FormLabel>
                        <p className="text-xs text-muted-foreground">Always prioritize low-risk zones</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            form.handleSubmit(onSubmit)();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowRealTimeUpdates"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4 bg-white">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Real-Time Updates</FormLabel>
                        <p className="text-xs text-muted-foreground">Notify if area safety level changes</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            form.handleSubmit(onSubmit)();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {isEditing && (
              <Button type="submit" className="w-full h-12 text-lg">
                Save Changes
              </Button>
            )}
          </form>
        </Form>

        <Card className="border-0 shadow-sm">
           <CardContent className="p-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-12 text-base font-normal"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
           </CardContent>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground px-8 leading-relaxed">
          Location data is used only during active navigation to provide safety insights and is not stored or tracked in the background.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
