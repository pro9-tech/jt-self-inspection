/**
 * Fixed left sider + top header + scrolling content. The shared frame for every Janytree app.
 */
export interface AppShellProps {
  sider?: React.ReactNode;
  header?: React.ReactNode;
  /** Collapse the sider to icon-only width (tablet behaviour) */
  collapsed?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function AppShell(props: AppShellProps): JSX.Element;
export interface SiderSectionProps { title?: string; children?: React.ReactNode }
export declare function SiderSection(props: SiderSectionProps): JSX.Element;
