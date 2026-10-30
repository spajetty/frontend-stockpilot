import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Alert, Button, Checkbox, Input, Logo } from "../components";
import { useAuth } from "../auth/AuthContext";
import { DEMO_ACCOUNTS } from "../api/authApi";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type FieldErrors = Partial<Record<"email" | "password", string>>;

const ROLE_LABEL = {
  Owner: "Owner",
  Manager: "Manager",
  Cashier: "Cashier",
  InventoryClerk: "Inventory clerk",
} as const;

const STATS = [
  { value: "₱2.4M", label: "Monthly sales tracked" },
  { value: "18k+", label: "Stock movements logged" },
  { value: "4", label: "Demo roles" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("owner@stockpilot.ph");
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = schema.safeParse({ email, password });
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await login(result.data.email, result.data.password, remember);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo1234");
    setErrors({});
    setFormError(null);
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <aside
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden px-[5%] py-[4.5rem] text-white lg:flex"
        style={{
          background:
            "radial-gradient(60% 45% at 75% 22%, rgba(91,68,214,.5), transparent 70%), radial-gradient(55% 40% at 10% 95%, rgba(37,99,235,.35), transparent 70%), #120a3a",
        }}
      >
        <div>
          <Logo onDark size="lg" tagline="Retail operating system" />
          <h1 className="mt-24 max-w-[12ch] text-5xl font-semibold leading-[1.05] tracking-tight xl:text-[64px]">
            Every sale, every shelf, one dashboard.
          </h1>
          <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-white/90">
            Point of sale, inventory movement, suppliers, and purchase orders with role-based access for owners,
            managers, cashiers, and inventory clerks.
          </p>
        </div>

        <div>
          <dl className="grid max-w-[38rem] grid-cols-3 gap-6 border-t border-indigo-400/30 pt-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="text-3xl font-semibold">{s.value}</dd>
                <dt className="mt-1 text-sm text-white/80">{s.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-20 flex items-center gap-2 text-sm text-white/85">
            <i className="ri-information-line" aria-hidden="true" />
            Frontend prototype — no real authentication or payments.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="grid flex-1 place-items-center px-6 py-12">
        <div className="w-full max-w-[470px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-[32px] font-semibold tracking-tight">Sign in to your store</h2>
          <p className="mt-1 text-[17px] leading-snug text-slate-500">
            Use a demo account below. Every account uses the password <strong className="text-slate-600">demo1234</strong>.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {formError && <Alert variant="error">{formError}</Alert>}

            <Input
              label="Email address"
              type="email"
              size="lg"
              autoComplete="username"
              value={email}
              onChange={(v: any) => {
                setEmail(v);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              size="lg"
              autoComplete="current-password"
              value={password}
              onChange={(v: any) => {
                setPassword(v);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
            />

            <div className="flex items-center justify-between">
              <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
              <a href="#" onClick={(e) => e.preventDefault()} className="text-[15px] font-medium text-brand hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" size="lg" icon="ri-arrow-right-line" iconPosition="right" loading={submitting} loadingText="Signing in…">
              Sign in
            </Button>

            <div className="flex items-center gap-4 text-sm text-slate-500" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200" /> OR <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Button
              variant="outline"
              size="lg"
              icon="ri-google-fill"
              iconColorClass="text-[#EA4335]"
              disabled
              title="Google sign-in arrives with the backend"
            >
              Continue with Google
            </Button>
          </form>

          <div className="mt-8">
            <p className="mb-2 text-sm font-medium text-slate-600">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => fillDemo(a.email)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span className="block font-medium">{ROLE_LABEL[a.role]}</span>
                  <span className="block truncate text-slate-500">{a.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-[13px] leading-relaxed text-slate-400">
            StockPilot demo prototype. Data is stored locally in your browser.
            <br />
            No real payments, refunds, or inventory movements reach a server.
          </p>
        </div>
      </main>
    </div>
  );
}