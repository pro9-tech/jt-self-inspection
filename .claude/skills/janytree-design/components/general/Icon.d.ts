/** Material Symbols Rounded glyph; inherits currentColor and fills only when active. */
export interface IconProps {
  /** Material Symbols Rounded ligature name, e.g. "science", "description" */
  name: string;
  /** 20 for dense UI, 24 default, 40 for empty states */
  size?: 20 | 24 | 40 | number;
  /** Fill axis — use only for the selected/active state */
  filled?: boolean;
  weight?: 400 | 500;
  color?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
