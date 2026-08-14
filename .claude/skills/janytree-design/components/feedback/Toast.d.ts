/** Transient dark-ink confirmation (Toast, ~3s) and top-right Notification card. */
export interface ToastProps { tone?: 'default' | 'success' | 'error'; message: React.ReactNode; icon?: string; style?: React.CSSProperties }
export declare function Toast(props: ToastProps): JSX.Element;
export interface NotificationProps { tone?: 'info' | 'success' | 'warning' | 'error'; title: React.ReactNode; description?: string; time?: string; onClose?: () => void; style?: React.CSSProperties }
export declare function Notification(props: NotificationProps): JSX.Element;
