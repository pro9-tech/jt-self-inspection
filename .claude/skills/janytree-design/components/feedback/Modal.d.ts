/** Centred edit dialog (Modal) and right-side panel (Drawer) — elevated surface, dimmed overlay. */
export interface ModalProps { open?: boolean; title?: React.ReactNode; onClose?: () => void; footer?: React.ReactNode; width?: number; children?: React.ReactNode }
export declare function Modal(props: ModalProps): JSX.Element | null;
export interface DrawerProps { open?: boolean; title?: React.ReactNode; onClose?: () => void; footer?: React.ReactNode; width?: number; children?: React.ReactNode }
export declare function Drawer(props: DrawerProps): JSX.Element | null;
