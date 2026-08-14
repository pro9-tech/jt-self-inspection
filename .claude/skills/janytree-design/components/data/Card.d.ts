/**
 * Container surface — white, 16px radius, hairline border, shadow-1. AppTile is the launcher variant.
 */
export interface CardProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
  /** Optional leading icon in the header, e.g. { icon: 'science', color: 'var(--jt-teal-600)' } */
  accent?: { icon: string; color?: string };
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
export interface AppTileProps { name: string; icon: string; /** One of the launcher registry colours (--app-*) */ color: string; onClick?: () => void }
export declare function AppTile(props: AppTileProps): JSX.Element;
