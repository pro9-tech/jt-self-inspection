/** Vertical issuance / approval history. Accent dots for completed events, neutral for pending. */
export interface TimelineItem { title: React.ReactNode; meta?: string; description?: string; tone?: 'done' | 'pending' }
export interface TimelineProps { items: TimelineItem[]; style?: React.CSSProperties }
export declare function Timeline(props: TimelineProps): JSX.Element;
