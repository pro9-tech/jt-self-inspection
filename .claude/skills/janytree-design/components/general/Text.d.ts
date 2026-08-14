/** Typographic role wrapper — display/h1..h3/body/sm/caption, with tone and tabular-numeric variants. */
export interface TextProps {
  role?: 'display' | 'h1' | 'h2' | 'h3' | 'bodyLg' | 'body' | 'sm' | 'caption';
  tone?: 'default' | 'secondary' | 'tertiary' | 'accent' | 'inverse';
  /** Override the rendered element */
  as?: keyof JSX.IntrinsicElements;
  /** Render with Figtree + tabular-nums (prices, doc numbers, codes) */
  numeric?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Text(props: TextProps): JSX.Element;
