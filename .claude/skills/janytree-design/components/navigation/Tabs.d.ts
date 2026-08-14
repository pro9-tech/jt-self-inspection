/** Underline tab bar; the active tab is accent text with a 2px accent underline. */
export interface TabItem { key: string; label: string; icon?: string; count?: number }
export interface TabsProps { items: TabItem[]; activeKey?: string; onChange?: (key: string) => void; size?: 'sm' | 'md'; style?: React.CSSProperties }
export declare function Tabs(props: TabsProps): JSX.Element;
