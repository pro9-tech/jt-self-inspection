/** Determinate bar for uploads and production progress; completes to success green. */
export interface ProgressProps { value?: number; tone?: 'accent' | 'success' | 'warning' | 'error'; showLabel?: boolean; size?: 'sm' | 'md'; style?: React.CSSProperties }
export declare function Progress(props: ProgressProps): JSX.Element;
