import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@uptimecrow/shared";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { usePageMeta } from "@/lib/meta";
import { MarketingNav } from "@/components/marketing-nav";
import "./landing-redesign.css";
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
    <div className="lp">
      <MarketingNav />
      <div className="lp-auth">
        <div className="lp-auth-card">
          <img className="lp-auth-mascot" src="/crow-mascot.png" alt="" aria-hidden="true" />
          <h1>Create your account</h1>
          <p className="lp-auth-sub">Free forever — 10 monitors, no credit card.</p>

          <form className="lp-auth-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="lp-auth-field">
              <label htmlFor="name">Name</label>
              <input id="name" placeholder="Your name" {...register("name")} />
              {errors.name && <p className="lp-auth-err">{errors.name.message}</p>}
            </div>
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
                placeholder="Min 8 characters"
                {...register("password")}
              />
              {errors.password && <p className="lp-auth-err">{errors.password.message}</p>}
            </div>
            <button type="submit" className="lp-auth-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create free account"}
            </button>
          </form>

          <p className="lp-auth-alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
