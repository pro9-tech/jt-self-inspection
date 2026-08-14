/** Hover hint (dark ink capsule) and click Popover (elevated panel). */
export interface TooltipProps { content: React.ReactNode; placement?: 'top' | 'bottom'; children?: React.ReactNode; style?: React.CSSProperties }
export declare function Tooltip(props: TooltipProps): JSX.Element;
export interface PopoverProps { content: React.ReactNode; title?: string; children?: React.ReactNode; style?: React.CSSProperties }
export declare function Popover(props: PopoverProps): JSX.Element;
