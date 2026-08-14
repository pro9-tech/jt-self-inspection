/**
 * Dense data grid — sticky header on --jt-neutral-50, hairline row splits, accent hover/selection, tabular numerals.
 */
export interface TableColumn {
  key: string;
  title: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  /** Render with Figtree + tabular-nums; pair with align:'right' */
  numeric?: boolean;
  muted?: boolean;
  wrap?: boolean;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
}
export interface TableProps {
  columns: TableColumn[];
  rows: any[];
  rowKey?: string;
  selectedKeys?: (string | number)[];
  sort?: string;
  onSort?: (key: string) => void;
  onRowClick?: (row: any) => void;
  empty?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Table(props: TableProps): JSX.Element;
