import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@uptimecrow/shared";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { usePageMeta } from "@/lib/meta";
import { MarketingNav } from "@/components/marketing-nav";
import "./landing-redesign.css";
import type { z } from "zod";

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  usePageMeta({
    title: "Log in — UptimeCrow",
    description: "Sign in to your UptimeCrow account.",
    robots: "noindex,nofollow",
  });
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp">
      <MarketingNav />
      <div className="lp-auth">
        <div className="lp-auth-card">
          <img className="lp-auth-mascot" src="/crow-mascot.png" alt="" aria-hidden="true" />
          <h1>Welcome back</h1>
          <p className="lp-auth-sub">Sign in to your UptimeCrow account</p>

          <form className="lp-auth-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="lp-auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@company.com" {...register("email")} />
              {errors.email && <p className="lp-auth-err">{errors.email.message}</p>}
            </div>
            <div className="lp-auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
              />
              {errors.password && <p className="lp-auth-err">{errors.password.message}</p>}
            </div>
            <div className="lp-auth-forgot">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <button type="submit" className="lp-auth-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="lp-auth-alt">
            Don&apos;t have an account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
