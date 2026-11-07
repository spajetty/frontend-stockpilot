export type RoleKey = 'owner' | 'manager' | 'cashier' | 'inventoryclerk';

export function toRoleKey(role: unknown): RoleKey | null {
  const key = String(role ?? '').toLowerCase().replace(/[\s_-]/g, '');
  return key === 'owner' || key === 'manager' || key === 'cashier' || key === 'inventoryclerk'
    ? key
    : null;
}

export const ROLE_LABEL: Record<RoleKey, string> = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  inventoryclerk: 'Inventory Clerk',
};

export interface NavItem {
  label: string;
  path: string;
  icon: string; 
  roles: RoleKey[];
  tag?: string; 
  alertBadge?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const O: RoleKey = 'owner';
const M: RoleKey = 'manager';
const C: RoleKey = 'cashier';
const I: RoleKey = 'inventoryclerk';

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'ri-dashboard-line', tag: '01', roles: [O, M] },
      { label: 'Products', path: '/products', icon: 'ri-price-tag-3-line', tag: '02', roles: [O, M, I] },
      { label: 'Inventory', path: '/inventory', icon: 'ri-inbox-archive-line', alertBadge: true, roles: [O, M, I] },
      { label: 'Point of Sale', path: '/pos', icon: 'ri-store-2-line', tag: '04', roles: [M, C] },
      { label: 'Sales & Reports', path: '/sales', icon: 'ri-bar-chart-box-line', tag: '05', roles: [O, M, C] },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'AI Insights', path: '/ai-insights', icon: 'ri-sparkling-line', tag: 'AI', roles: [O, M, I] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Staff & Roles', path: '/staff', icon: 'ri-team-line', tag: '06', roles: [O] },
      { label: 'Payments', path: '/payments', icon: 'ri-bank-card-line', tag: '07', roles: [O, M] },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function getNavForRole(role: RoleKey | null): NavSection[] {
  if (!role) return [];
  return NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(role)) })).filter(
    (s) => s.items.length > 0,
  );
}

export function getHomePath(role: RoleKey | null): string {
  return getNavForRole(role)[0]?.items[0]?.path ?? '/login';
}

export const CAN_START_SALE: RoleKey[] = [M, C];

export const STORE_NAME = 'StockPilot Demo Store';