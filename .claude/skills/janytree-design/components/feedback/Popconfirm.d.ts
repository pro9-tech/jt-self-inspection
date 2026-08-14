/** Inline confirmation anchored to the control that triggers an irreversible action. */
export interface PopconfirmProps { title: React.ReactNode; description?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm?: () => void; children?: React.ReactNode; style?: React.CSSProperties }
export declare function Popconfirm(props: PopconfirmProps): JSX.Element;
