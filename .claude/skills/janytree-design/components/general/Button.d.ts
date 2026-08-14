import * as React from 'react';
/**
 * Primary action control. Primary = solid charcoal, Default = outlined, Text = bare, Link = accent blue.
 */
export interface ButtonProps {
  /** primary = solid charcoal; default = outlined; text = bare; link = accent blue */
  variant?: 'primary' | 'default' | 'text' | 'link';
  size?: 'sm' | 'md' | 'lg';
  /** Destructive action — recolours to the error ramp */
  danger?: boolean;
  disabled?: boolean;
  block?: boolean;
  /** Material Symbols Rounded ligature name */
  iconLeft?: string;
  iconRight?: string;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
