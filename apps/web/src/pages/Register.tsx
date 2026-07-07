import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@uptimecrow/shared";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { usePageMeta } from "@/lib/meta";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  usePageMeta({
    title: "Create your account — UptimeCrow",
    description:
      "Sign up free — 10 monitors, 1 status page, 5-minute checks, no credit card required.",
    robots: "noindex,nofollow",
  });
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
      toast.error(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Put a crow on your uptime."
      subtitle="Free forever — 10 monitors, 1 status page, 5-minute checks. No credit card."
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your name" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-xs text-danger-foreground">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-danger-foreground">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Min 8 characters" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-danger-foreground">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create free account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
