/** Inline banner for a condition the user must know about before acting. */
export interface AlertProps { tone?: 'info' | 'success' | 'warning' | 'error'; title?: React.ReactNode; action?: React.ReactNode; onClose?: () => void; children?: React.ReactNode; style?: React.CSSProperties }
export declare function Alert(props: AlertProps): JSX.Element;
