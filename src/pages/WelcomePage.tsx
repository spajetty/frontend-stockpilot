import { Button, Logo } from "../components";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../auth/types";

// Mirrors the permissions table in the project plan. Temporary display only;
// real enforcement happens in the .NET API.
const ACCESS: Record<Role, { title: string; modules: string[] }> = {
  Owner: {
    title: "Owner",
    modules: ["Dashboard", "Products", "Inventory", "Checkout", "Refunds", "Reports", "Staff management", "Audit logs"],
  },
  Manager: {
    title: "Manager",
    modules: ["Operations dashboard", "Products", "Inventory", "Checkout", "Limited refunds", "Operational reports", "Limited audit logs"],
  },
  Cashier: {
    title: "Cashier",
    modules: ["Own-sales dashboard", "Products (view)", "Checkout", "Own-sales reports"],
  },
  InventoryClerk: {
    title: "Inventory clerk",
    modules: ["Inventory dashboard", "Products (view)", "Stock receiving and adjustments", "Stock reports"],
  },
};

export default function WelcomePage() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const access = ACCESS[user.role];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="text-right text-sm leading-tight">
              <p className="font-medium">{user.fullName}</p>
              <p className="text-slate-500">{access.title}</p>
            </div>
            <Button variant="outline" icon="ri-logout-box-r-line" fullWidth={false} onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-2 text-slate-500">
          You're signed in as {access.title.toLowerCase()}. This is a temporary page until the real dashboard is built.
        </p>

        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">What this role can open</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {access.modules.map((m) => (
              <li key={m} className="rounded-lg border border-slate-200 px-4 py-3 text-sm">{m}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}