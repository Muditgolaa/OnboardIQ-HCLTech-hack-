import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '@/api/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ROLE_LABEL } from '@/lib/roles';
import { DEMO_ACCOUNTS } from './demo-accounts';
import { useAuth } from './useAuth';

function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Invalid e-mail or password.';
    if (err.status === 429) return err.message;
    if (err.status === 400) return 'Enter your e-mail and password.';
  }
  return 'Sign-in failed. Check your connection and try again.';
}

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(messageFor(err));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[3fr_2fr]">
      <section>
        <p className="text-xs font-semibold tracking-widest text-forest uppercase">
          Savings account onboarding
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
          Clean applications in minutes, doubtful ones to a person.
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          AI proposes, rules decide, humans approve. Every decision and document view is audited.
        </p>
      </section>

      <Card aria-labelledby="login-title" className="self-start">
        <CardHeader>
          <CardTitle id="login-title">Sign in</CardTitle>
          <CardDescription>Use your OnboardIQ account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4" noValidate>
            <label className="grid gap-1.5 text-sm font-medium">
              E-mail
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Password
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
              />
            </label>
            {error && (
              <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" loading={busy} disabled={!email || !password}>
              Sign in
            </Button>
            <p className="text-sm text-ink-soft">
              New applicant?{' '}
              <Link to="/register" className="font-medium text-forest underline">
                Create an account
              </Link>
            </p>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-xs font-semibold tracking-widest text-ink-soft uppercase">
                Demo accounts (development only)
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Password: SEED_DEMO_PASSWORD from your .env
              </p>
              <ul className="mt-2 grid gap-1">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email}>
                    <button
                      type="button"
                      onClick={() => setEmail(account.email)}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs hover:bg-ivory-deep"
                    >
                      <span className="font-mono">{account.email}</span>
                      <span className="text-ink-soft">{ROLE_LABEL[account.role]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
