import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@uptimecrow/shared";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

const PERKS = [
  "Free forever — no credit card required",
  "Monitor up to 3 services instantly",
  "Slack & Discord alert integrations",
  "Public status pages for your users",
  "Pre-rendered status pages that survive origin downtime",
  "Up and running in under 3 minutes",
];

export function Register() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.name);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — value proposition */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-card border-r border-border">
        <Logo size="md" to="/" />
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Everything you need to<br />stay on top of uptime
            </h2>
            <p className="text-muted-foreground">
              Join teams that trust UptimeCrow to monitor their services 24/7 and keep their users informed.
            </p>
          </div>
          <ul className="space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} UptimeCrow. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="md" to="/" />
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start monitoring your services for free</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create free account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
