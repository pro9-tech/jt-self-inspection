/** Path trail for deep hierarchies (PLM, documents). Separator "/", current node is plain text. */
export interface BreadcrumbItem { label: string; href?: string; onClick?: () => void }
export interface BreadcrumbProps { items: BreadcrumbItem[]; style?: React.CSSProperties }
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
