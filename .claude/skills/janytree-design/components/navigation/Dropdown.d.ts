/** Click-triggered elevated menu — kebab row actions, account menu, app launcher. */
export interface DropdownItem { key?: string; label?: string; icon?: string; danger?: boolean; divider?: boolean; onClick?: () => void }
export interface DropdownProps { trigger: React.ReactNode; items: DropdownItem[]; align?: 'left' | 'right'; onSelect?: (key: string) => void; style?: React.CSSProperties }
export declare function Dropdown(props: DropdownProps): JSX.Element;
