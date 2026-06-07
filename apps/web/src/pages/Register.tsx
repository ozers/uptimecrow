import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
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
      await registerUser(data.email, data.password, data.name, inviteToken ?? undefined);
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
              {loading
                ? "Creating account…"
                : inviteToken
                  ? "Create account & accept invite"
                  : "Create free account"}
            </button>
          </form>

          <div className="lp-auth-divider">or</div>

          <a
            href={`/api/auth/google${inviteToken ? `?invite=${inviteToken}` : ""}`}
            className="lp-auth-google"
          >
            <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
            Continue with Google
          </a>

          <p className="lp-auth-alt">
            Already have an account?{" "}
            <Link to={inviteToken ? `/login?invite=${inviteToken}` : "/login"}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
