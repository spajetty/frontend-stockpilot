import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../auth/roles';
import { cx } from '../lib/cx';
import Button from './Button';
import Logo from './Logo';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:bg-slate-100',
  );

// Temporary top bar. It gets replaced by the sidebar layout when the app shell is built.
export default function AppHeader() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="flex items-center gap-1" aria-label="Main">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            {user.role === 'Owner' && <NavLink to="/staff" className={linkClass}>Staff</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right text-sm leading-tight sm:block">
            <p className="font-medium">{user.fullName}</p>
            <p className="text-slate-500">{ROLE_LABEL[user.role]}</p>
          </div>
          <Button variant="outline" icon="ri-logout-box-r-line" fullWidth={false} onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}