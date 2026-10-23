import { useState } from 'react';
import { Navigate, NavLink, Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { NAV_BY_ROLE } from '@/lib/navigation';
import { ROLE_LABEL } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { AppFooter } from './AppFooter';

/**
 * Header, role-specific navigation and the page outlet. The links shown depend on the role purely for convenience:
 * every action behind them is authorised again by the backend.
 */
export function AppShell() {
  const { state, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  if (state.status === 'checking')
    return (
      <p role="status" className="p-8 text-ink-soft">
        Checking your session…
      </p>
    );
  if (state.status !== 'authenticated') return <Navigate to="/login" replace />;
  const user = state.user;
  const links = NAV_BY_ROLE[user.role];

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-white/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <span className="font-display text-2xl tracking-tight">
            OnboardIQ
            <span className="ml-1 align-super font-sans text-[0.6rem] font-semibold tracking-widest text-forest">
              KYC
            </span>
          </span>
          <button
            type="button"
            className="ml-auto rounded-md border border-line px-3 py-1.5 text-sm md:hidden"
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen((v) => !v)}
          >
            Menu
          </button>
          <nav
            id="main-nav"
            aria-label="Main"
            className={cn(
              'order-3 w-full flex-wrap gap-x-5 gap-y-1 text-sm md:order-none md:flex md:w-auto',
              open ? 'flex' : 'hidden',
            )}
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end ?? false}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'border-b-2 py-1',
                    isActive
                      ? 'border-forest text-ink'
                      : 'border-transparent text-ink-soft hover:text-ink',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-3 text-sm md:flex">
            <span className="text-right leading-tight">
              <span className="block font-medium">{user.display_name}</span>
              <span className="block text-xs text-ink-soft">{ROLE_LABEL[user.role]}</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>
        <div
          className={cn(
            'border-t border-line px-4 py-2 text-sm md:hidden',
            open ? 'flex items-center justify-between' : 'hidden',
          )}
        >
          <span>
            {user.display_name} · {ROLE_LABEL[user.role]}
          </span>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
