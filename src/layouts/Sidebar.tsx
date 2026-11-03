import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL, getNavForRole, toRoleKey } from '../config/navigation';
import { cx } from '../lib/cx';

// TODO: replace with the real low-stock count from the API later.
const LOW_STOCK_COUNT = 5;

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function useDisplayUser() {
  const { user, logout } = useAuth();
  const role = toRoleKey(user?.role);
  const fullName = user?.fullName || user?.email || "User";
  return { role, roleLabel: role ? ROLE_LABEL[role] : "", fullName, logout };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const { role, roleLabel, fullName, logout } = useDisplayUser();
  const sections = getNavForRole(role);

  return (
    <>
      {/* backdrop on small screens */}
      <div
        onClick={onClose}
        className={cx(
          'fixed inset-0 z-30 bg-slate-900/40 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#5b44d6] text-white">
            <i className="ri-store-3-fill text-xl" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold text-slate-900">StockPilot</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Retail OS</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cx(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
                          isActive
                            ? 'bg-[#5b44d6]/10 text-[#5b44d6]'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                        )
                      }
                    >
                      <i className={cx(item.icon, 'text-lg')} />
                      <span className="flex-1">{item.label}</span>
                      {item.alertBadge ? (
                        LOW_STOCK_COUNT > 0 && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                            {LOW_STOCK_COUNT}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">{item.tag}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Signed-in user */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#5b44d6]/15 text-sm font-semibold text-[#5b44d6]">
              {initials(fullName)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
            >
              <i className="ri-logout-box-r-line text-lg" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}