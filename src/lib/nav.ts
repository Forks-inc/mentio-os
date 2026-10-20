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

/** One flat list; an item with children opens a sub-list. */
export const NAV: NavItem[] = [
  { href: '/', label: 'Resumen', icon: LayoutDashboard },
  { href: '/mentions', label: 'Menciones', icon: Radio },
  { href: '/views', label: 'Vistas', icon: Eye },
  { href: '/keywords', label: 'Candidatos y temas', icon: Tag },
  { href: '/analytics', label: 'Análisis', icon: TrendingUp },
  {
    href: '/people',
    label: 'Audiencia',
    icon: UsersRound,
    children: [
      { href: '/people', label: 'Personas', icon: LayoutGrid },
      { href: '/segments', label: 'Segmentos', icon: Layers },
    ],
  },
  {
    href: '/alerts',
    label: 'Alertas',
    icon: Bell,
    children: [
      { href: '/alerts', label: 'Reglas', icon: Bell },
      { href: '/channels', label: 'Canales', icon: Webhook },
    ],
  },
  { href: '/settings/api-keys', label: 'Claves de API', icon: KeyRound },
  { href: '/settings/team', label: 'Equipo', icon: AtSign },
  { href: '/settings/company', label: 'Ajustes', icon: Settings },
];

/** The settings pages, for the breadcrumb above them. */
export const SETTINGS: NavItem[] = [
  { href: '/settings/company', label: 'Perfil de la organización', icon: Building2 },
  { href: '/settings/groups', label: 'Campañas', icon: FolderTree },
  { href: '/settings/filters', label: 'Filtros de ruido', icon: Filter },
  { href: '/settings/team', label: 'Equipo', icon: AtSign },
  { href: '/settings/api-keys', label: 'Claves de API', icon: KeyRound },
  { href: '/settings/billing', label: 'Facturación', icon: Wallet },
];

export const DOCS = { href: '#', label: 'Inteligencia política', icon: BookOpen };
