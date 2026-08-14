/** Full-screen outcome page for issuance success or failure. */
export interface ResultProps { status?: 'success' | 'error' | 'warning' | 'info'; title: React.ReactNode; description?: string; extra?: React.ReactNode; style?: React.CSSProperties }
export declare function Result(props: ResultProps): JSX.Element;
