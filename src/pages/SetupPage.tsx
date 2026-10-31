import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Input, Logo, Modal, ProgressSteps, Select } from "../components";
import type { SelectOption } from "../components";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABEL } from "../auth/roles";
import { authApi } from "../api/authApi";
import type { Gender } from "../auth/types";

const STEPS = ["Personal info", "Secure your account"];

const GENDER_OPTIONS: SelectOption[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "PreferNotToSay", label: "Prefer not to say" },
];

type PersonalErrors = Partial<Record<"firstName" | "surname" | "birthday" | "gender", string>>;

const toLocalIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function SetupPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [personalErrors, setPersonalErrors] = useState<PersonalErrors>({});

  // Step 2
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmError, setConfirmError] = useState<string>();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // After success: show the modal briefly, then sign out so the next login carries a fresh token
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      logout();
      navigate("/login", { replace: true });
    }, 3500);
    return () => clearTimeout(timer);
  }, [done, logout, navigate]);

  if (!user) return null;

  const rules = [
    { ok: password.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Za-z]/.test(password), label: "Contains a letter" },
    { ok: /\d/.test(password), label: "Contains a number" },
    { ok: password.length > 0 && password === confirm, label: "Both passwords match" },
  ];

  const goNext = () => {
    const next: PersonalErrors = {};
    if (!firstName.trim()) next.firstName = "Enter your first name.";
    if (!surname.trim()) next.surname = "Enter your surname.";
    if (!birthday) next.birthday = "Select your birthday.";
    else if (birthday > toLocalIso(new Date())) next.birthday = "Birthday can't be in the future.";
    if (!gender) next.gender = "Select an option.";

    setPersonalErrors(next);
    if (Object.keys(next).length === 0) {
      setFormError(null);
      setStep(1);
    }
  };

  const finish = async () => {
    setFormError(null);
    setPasswordError(undefined);
    setConfirmError(undefined);

    if (!rules[0].ok || !rules[1].ok || !rules[2].ok) {
      setPasswordError("Your password doesn't meet the requirements below.");
      return;
    }
    if (!rules[3].ok) {
      setConfirmError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.completeSetup({
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        surname: surname.trim(),
        birthday,
        gender: gender as Gender,
        newPassword: password,
      });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-xl">
        <Logo />

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <ProgressSteps steps={STEPS} current={step} />

          <div className="mt-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === 0 ? "Tell us about yourself" : "Choose a new password"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {step === 0
                ? `You're signing in as ${user.email} (${ROLE_LABEL[user.role]}). Complete your profile to unlock your account.`
                : "Your temporary password was sent by email, so it isn't private anymore. Set one only you know."}
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {formError && <Alert variant="error">{formError}</Alert>}

            {step === 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="First name"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(v) => { setFirstName(v); setPersonalErrors((p) => ({ ...p, firstName: undefined })); }}
                    error={personalErrors.firstName}
                  />
                  <Input
                    label="Middle name"
                    autoComplete="additional-name"
                    value={middleName}
                    onChange={setMiddleName}
                    hint="Optional"
                  />
                </div>
                <Input
                  label="Surname"
                  required
                  autoComplete="family-name"
                  value={surname}
                  onChange={(v) => { setSurname(v); setPersonalErrors((p) => ({ ...p, surname: undefined })); }}
                  error={personalErrors.surname}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Birthday"
                    type="date"
                    required
                    autoComplete="bday"
                    max={toLocalIso(new Date())}
                    value={birthday}
                    onChange={(v) => { setBirthday(v); setPersonalErrors((p) => ({ ...p, birthday: undefined })); }}
                    error={personalErrors.birthday}
                  />
                  <Select
                    label="Gender"
                    required
                    options={GENDER_OPTIONS}
                    value={gender}
                    onChange={(v) => { setGender(v); setPersonalErrors((p) => ({ ...p, gender: undefined })); }}
                    error={personalErrors.gender}
                  />
                </div>
              </>
            ) : (
              <>
                <Input
                  label="New password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(v) => { setPassword(v); setPasswordError(undefined); }}
                  error={passwordError}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(v) => { setConfirm(v); setConfirmError(undefined); }}
                  error={confirmError}
                />
                <ul className="space-y-1.5 text-sm" aria-label="Password requirements">
                  {rules.map((r) => (
                    <li key={r.label} className={r.ok ? "text-emerald-700" : "text-slate-500"}>
                      <i className={r.ok ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"} aria-hidden="true" />{" "}
                      {r.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            {step === 0 ? (
              <Button variant="cancel" fullWidth={false} onClick={logout}>
                Cancel and sign out
              </Button>
            ) : (
              <Button variant="back" fullWidth={false} onClick={() => setStep(0)} disabled={submitting}>
                Back
              </Button>
            )}

            {step === 0 ? (
              <Button variant="next" iconPosition="right" fullWidth={false} onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button variant="submit" fullWidth={false} loading={submitting} loadingText="Saving…" onClick={finish}>
                Finish setup
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          If you cancel before finishing, you'll be asked to complete these steps again next time you sign in.
        </p>
      </div>

      <Modal open={done} labelledBy="unlocked-title">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
          <i className="ri-lock-unlock-line" aria-hidden="true" />
        </div>
        <h2 id="unlocked-title" className="mt-5 text-2xl font-semibold">Account unlocked</h2>
        <p className="mt-2 text-slate-600">
          Your role is <strong>{ROLE_LABEL[user.role]}</strong>. Please sign in again to access the application.
        </p>
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
          <i className="ri-loader-4-line animate-spin" aria-hidden="true" /> Redirecting…
        </p>
      </Modal>
    </div>
  );
}