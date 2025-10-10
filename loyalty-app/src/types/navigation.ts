export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  description?: string;
  submenu?: NavigationItem[];
  badge?: string | number;
  isActive?: boolean;
}

export interface NavigationConfig {
  mainMenu: NavigationItem[];
  bottomMenu: NavigationItem[];
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
