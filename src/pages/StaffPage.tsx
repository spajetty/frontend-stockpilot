import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, AppHeader, Button, Input, Select } from "../components";
import type { SelectOption } from "../components";
import { usersApi } from "../api/usersApi";
import { INVITABLE_ROLES, ROLE_LABEL } from "../auth/roles";
import type { Role, StaffMember } from "../auth/types";

const ROLE_OPTIONS: SelectOption[] = INVITABLE_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StatusBadge({ member }: { member: StaffMember }) {
  const [label, style] = !member.isActive
    ? ["Inactive", "bg-slate-100 text-slate-600"]
    : member.isFirstLogin
      ? ["Pending setup", "bg-amber-100 text-amber-800"]
      : ["Active", "bg-emerald-100 text-emerald-800"];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>;
}

export default function StaffPage() {
  const [members, setMembers] = useState<StaffMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [roleError, setRoleError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setMembers(await usersApi.list());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load staff accounts.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    const trimmed = email.trim();
    const emailProblem = !trimmed ? "Enter an email address." : !EMAIL_PATTERN.test(trimmed) ? "Enter a valid email address." : undefined;
    const roleProblem = role ? undefined : "Choose a role.";
    setEmailError(emailProblem);
    setRoleError(roleProblem);
    if (emailProblem || roleProblem) return;

    setSubmitting(true);
    try {
      const created = await usersApi.invite(trimmed, role as Role);
      setSuccess(`Invitation sent to ${created.email}. They can sign in with the emailed temporary password, or with Google using this email address.`);
      setEmail("");
      setRole("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't create the account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Staff accounts</h1>
        <p className="mt-1 text-slate-500">Add an employee by email and role. We'll email them a temporary password.</p>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Add an account</h2>
          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-5">
            {formError && <Alert variant="error">{formError}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
              <Input
                label="Employee email"
                type="email"
                autoComplete="off"
                placeholder="name@gmail.com"
                value={email}
                onChange={(v) => { setEmail(v); setEmailError(undefined); }}
                error={emailError}
              />
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                value={role}
                onChange={(v) => { setRole(v); setRoleError(undefined); }}
                error={roleError}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-md text-xs text-slate-500">
                The employee must use this exact email address, whether they sign in with a password or with Google.
              </p>
              <Button type="submit" variant="add" icon="ri-send-plane-line" fullWidth={false} loading={submitting} loadingText="Sending…">
                Send invitation
              </Button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold">All accounts</h2>
          </div>

          {loadError ? (
            <div className="space-y-3 p-6">
              <Alert variant="error">{loadError}</Alert>
              <Button variant="outline" icon="ri-refresh-line" fullWidth={false} onClick={() => void load()}>
                Try again
              </Button>
            </div>
          ) : members === null ? (
            <p className="flex items-center gap-2 p-6 text-sm text-slate-500" role="status">
              <i className="ri-loader-4-line animate-spin" aria-hidden="true" /> Loading accounts…
            </p>
          ) : members.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="px-6 py-4">
                        <p className="font-medium">{m.isFirstLogin ? "—" : m.fullName}</p>
                        <p className="text-slate-500">{m.email}</p>
                      </td>
                      <td className="px-6 py-4">{ROLE_LABEL[m.role]}</td>
                      <td className="px-6 py-4"><StatusBadge member={m} /></td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}