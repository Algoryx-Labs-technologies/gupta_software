import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  MapPin,
  Users,
  Tags,
  ClipboardList,
  Shield,
  HardHat,
  Wallet,
} from 'lucide-react';
import { Permission } from '@gupta/shared';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  children?: NavItem[];
}

export const navConfig: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    permission: Permission.VIEW_DASHBOARD,
  },
  {
    label: 'Purchases',
    path: '/purchases',
    icon: ShoppingCart,
    permission: Permission.MANAGE_PURCHASES,
  },
  {
    label: 'Tenders',
    path: '/tenders',
    icon: FileText,
    permission: Permission.MANAGE_TENDERS,
  },
  {
    label: 'Labour Expense',
    path: '/labour-expenses',
    icon: HardHat,
    permission: Permission.MANAGE_PURCHASES,
  },
  {
    label: 'Employee Salary',
    path: '/employee-salary',
    icon: Wallet,
    permission: Permission.MANAGE_PURCHASES,
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: Package,
    permission: Permission.MANAGE_INVENTORY,
  },
  {
    label: 'Sites',
    path: '/sites',
    icon: MapPin,
    permission: Permission.MANAGE_MASTERS,
  },
  {
    label: 'Vendors',
    path: '/vendors',
    icon: Users,
    permission: Permission.MANAGE_MASTERS,
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: Tags,
    permission: Permission.MANAGE_MASTERS,
  },
  {
    label: 'Team & Roles',
    path: '/admin/team',
    icon: Shield,
    permission: Permission.MANAGE_USERS,
  },
  {
    label: 'Activity Logs',
    path: '/admin/activity',
    icon: ClipboardList,
    permission: Permission.VIEW_ACTIVITY_LOGS,
  },
];

export function getFilteredNav(can: (p: Permission) => boolean): NavItem[] {
  return navConfig.filter((item) => !item.permission || can(item.permission));
}
