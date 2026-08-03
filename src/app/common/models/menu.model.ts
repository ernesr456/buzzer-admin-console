export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  isActive?: boolean;
  roles?: string[];
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
  isOpen?: boolean;
  roles?: string[];
}