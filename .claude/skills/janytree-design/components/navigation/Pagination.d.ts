/** Page control for large tables (전성분 76품목 etc.). Current page = accent. */
export interface PaginationProps { page?: number; pageSize?: number; total?: number; onChange?: (page: number) => void; style?: React.CSSProperties }
export declare function Pagination(props: PaginationProps): JSX.Element;
