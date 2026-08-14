/** Status pill (50-bg + 700-text) and numeric badge. Warning never uses white text. */
export interface TagProps { tone?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'teal'; icon?: string; children?: React.ReactNode; style?: React.CSSProperties }
export declare function Tag(props: TagProps): JSX.Element;
export interface BadgeProps { count?: number | string; dot?: boolean; tone?: 'success' | 'warning' | 'error' | 'info'; style?: React.CSSProperties }
export declare function Badge(props: BadgeProps): JSX.Element;
