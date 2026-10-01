/** The sidebar, in one place: add a page here to put it in the navigation. */
import {
  AtSign,
  Bell,
  BookOpen,
  Building2,
  Eye,
  Filter,
  FolderTree,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
  Radio,
  Settings,
  Tag,
  TrendingUp,
  UsersRound,
  Wallet,
  Webhook,
} from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon; children?: NavItem[] };

/** One flat list, like the Mentio dashboard's; an item with children opens a sub-list. */
export const NAV: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/mentions', label: 'Mentions', icon: Radio },
  { href: '/views', label: 'Views', icon: Eye },
  { href: '/keywords', label: 'Keywords', icon: Tag },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  {
    href: '/people',
    label: 'Audience',
    icon: UsersRound,
    children: [
      { href: '/people', label: 'People', icon: LayoutGrid },
      { href: '/segments', label: 'Segments', icon: Layers },
    ],
  },
  {
    href: '/alerts',
    label: 'Alerts',
    icon: Bell,
    children: [
      { href: '/alerts', label: 'Rules', icon: Bell },
      { href: '/channels', label: 'Channels', icon: Webhook },
    ],
  },
  { href: '/settings/api-keys', label: 'API keys', icon: KeyRound },
  { href: '/settings/team', label: 'Team', icon: AtSign },
  { href: '/settings/company', label: 'Settings', icon: Settings },
];

/** The settings pages, for the breadcrumb above them. */
export const SETTINGS: NavItem[] = [
  { href: '/settings/company', label: 'Company', icon: Building2 },
  { href: '/settings/groups', label: 'Groups', icon: FolderTree },
  { href: '/settings/filters', label: 'Noise filters', icon: Filter },
  { href: '/settings/team', label: 'Team', icon: AtSign },
  { href: '/settings/api-keys', label: 'API keys', icon: KeyRound },
  { href: '/settings/billing', label: 'Billing', icon: Wallet },
];

export const DOCS = { href: 'https://docs.mentio.dev', label: 'Documentation', icon: BookOpen };
