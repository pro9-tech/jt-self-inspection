/** Horizontal progress trail for approval / issuance flows. Done + current = accent, pending = tertiary. */
export interface StepItem { label: string }
export interface StepsProps { items: StepItem[]; current?: number; style?: React.CSSProperties }
export declare function Steps(props: StepsProps): JSX.Element;
