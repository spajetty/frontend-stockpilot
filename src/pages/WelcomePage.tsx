import { AppHeader } from "../components";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABEL } from "../auth/roles";
import type { Role } from "../auth/types";

// Mirrors the permissions table in the project plan. Temporary display only;
// real enforcement happens in the .NET API.
const MODULES: Record<Role, string[]> = {
  Owner: ["Dashboard", "Products", "Inventory", "Checkout", "Refunds", "Reports", "Staff management", "Audit logs"],
  Manager: ["Operations dashboard", "Products", "Inventory", "Checkout", "Limited refunds", "Operational reports", "Limited audit logs"],
  Cashier: ["Own-sales dashboard", "Products (view)", "Checkout", "Own-sales reports"],
  InventoryClerk: ["Inventory dashboard", "Products (view)", "Stock receiving and adjustments", "Stock reports"],
};

export default function WelcomePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-2 text-slate-500">
          You're signed in as {ROLE_LABEL[user.role].toLowerCase()}. This is a temporary page until the real dashboard is built.
        </p>

        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">What this role can open</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {MODULES[user.role].map((m) => (
              <li key={m} className="rounded-lg border border-slate-200 px-4 py-3 text-sm">{m}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}