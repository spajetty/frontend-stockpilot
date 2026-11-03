import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ALL_NAV_ITEMS, CAN_START_SALE } from '../config/navigation';
import { StoreSwitcher } from '../components/StoreSwitcher';
import { initials, useDisplayUser } from './Sidebar';

// TODO: replace with real unread notification count later.
const NOTIFICATION_COUNT = 5;

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { role, roleLabel, fullName, logout } = useDisplayUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageLabel = ALL_NAV_ITEMS.find((i) => pathname.startsWith(i.path))?.label ?? 'Workspace';

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-8">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <i className="ri-menu-line text-xl" />
      </button>

      {/* Breadcrumb + store */}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs text-slate-500">StockPilot / {pageLabel}</p>
        <StoreSwitcher />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Search (UI only for now) */}
        <label className="hidden h-11 w-72 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-[#5b44d6] md:flex xl:w-[420px]">
          <i className="ri-search-line" />
          <input
            type="search"
            placeholder="Search products or SKU..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        {role && CAN_START_SALE.includes(role) && (
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5b44d6] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4b37bd]"
          >
            <i className="ri-add-line text-lg" />
            <span className="hidden sm:inline">New sale</span>
          </button>
        )}

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <i className="ri-notification-3-line text-xl" />
          {NOTIFICATION_COUNT > 0 && (
            <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              {NOTIFICATION_COUNT}
            </span>
          )}
        </button>

        {/* User chip */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-slate-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-[#5b44d6]/15 text-xs font-semibold text-[#5b44d6]">
              {initials(fullName)}
            </span>
            <span className="hidden text-sm font-semibold text-slate-900 sm:block">{roleLabel}</span>
            <i className="ri-arrow-down-s-line text-lg text-slate-500" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <i className="ri-logout-box-r-line" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}