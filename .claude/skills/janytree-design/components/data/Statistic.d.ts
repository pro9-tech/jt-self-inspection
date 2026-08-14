/** Dashboard KPI figure — Figtree numerals at 26px with a secondary label. */
export interface StatisticProps { label: string; value: React.ReactNode; unit?: string; delta?: string; deltaTone?: 'success' | 'error'; icon?: string; style?: React.CSSProperties }
export declare function Statistic(props: StatisticProps): JSX.Element;
