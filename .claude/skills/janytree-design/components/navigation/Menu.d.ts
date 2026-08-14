/** Vertical sider navigation. Active item = accent text + left bar + filled icon. */
export interface MenuItem { key: string; label: string; icon?: string; badge?: string | number }
export interface MenuProps {
  items: MenuItem[];
  activeKey?: string;
  collapsed?: boolean;
  onSelect?: (key: string) => void;
  style?: React.CSSProperties;
}
export declare function Menu(props: MenuProps): JSX.Element;
export interface NavItemProps { icon?: string; label: string; active?: boolean; collapsed?: boolean; badge?: string | number; onClick?: () => void }
export declare function NavItem(props: NavItemProps): JSX.Element;
