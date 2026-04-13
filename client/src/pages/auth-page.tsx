import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const { login, register, user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-white rounded-2xl shadow-xl shadow-purple-900/5 mb-4">
            <Shield className="w-8 h-8 text-primary fill-primary/20" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">HerWay</h1>
          <p className="text-muted-foreground mt-2">Navigate safely, arrive confidently.</p>
        </div>

        <Card className="border-0 shadow-2xl shadow-purple-900/10 backdrop-blur-sm bg-white/90">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to access secure navigation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ username: "", password: "" }); // username maps to email in backend for passport-local

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync(formData);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    } catch (error: any) {
      toast({ 
        title: "Login Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email" 
          placeholder="you@example.com"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25" 
        disabled={login.isPending}
      >
        {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    emergencyContact1: "",
    emergencyContact2: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    try {
      await register.mutateAsync(formData);
      toast({ title: "Account created", description: "Welcome to HerWay!" });
    } catch (error: any) {
      toast({ 
        title: "Registration Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" required onChange={e => handleChange("fullName", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input id="reg-email" type="email" required onChange={e => handleChange("email", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" required onChange={e => handleChange("phone", e.target.value)} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input id="reg-password" type="password" required onChange={e => handleChange("password", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm</Label>
          <Input id="confirm" type="password" required onChange={e => handleChange("confirmPassword", e.target.value)} />
        </div>
      </div>

      <div className="pt-2 border-t">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Emergency Contacts</Label>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact1">Contact 1 (Phone)</Label>
            <Input id="contact1" type="tel" required placeholder="+1 234..." onChange={e => handleChange("emergencyContact1", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact2">Contact 2 (Phone)</Label>
            <Input id="contact2" type="tel" required placeholder="+1 234..." onChange={e => handleChange("emergencyContact2", e.target.value)} />
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full mt-4 bg-primary hover:bg-primary/90" 
        disabled={register.isPending}
      >
        {register.isPending ? "Creating..." : "Create Account"}
      </Button>
    </form>
  );
}
