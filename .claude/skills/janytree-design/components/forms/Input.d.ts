import * as React from 'react';
/** Single-line field at --jt-control-height with accent focus ring; numeric mode is Figtree + tabular, right-aligned. */
export interface InputProps {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'error' | 'warning';
  disabled?: boolean;
  /** Material Symbols ligature rendered inside the field's leading edge */
  prefix?: string;
  /** Trailing text, e.g. a unit */
  suffix?: string;
  numeric?: boolean;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
export interface InputNumberProps extends InputProps { step?: number; unit?: string }
export declare function InputNumber(props: InputNumberProps): JSX.Element;
export interface TextareaProps { value?: string; onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number; disabled?: boolean; style?: React.CSSProperties }
export declare function Textarea(props: TextareaProps): JSX.Element;
