/** Checkbox, Radio and Switch — all selected states use the accent blue. */
export interface CheckboxProps { checked?: boolean; onChange?: (next: boolean) => void; label?: string; disabled?: boolean; indeterminate?: boolean; style?: React.CSSProperties }
export declare function Checkbox(props: CheckboxProps): JSX.Element;
export interface RadioProps { checked?: boolean; onChange?: (next: boolean) => void; label?: string; disabled?: boolean; style?: React.CSSProperties }
export declare function Radio(props: RadioProps): JSX.Element;
export interface SwitchProps { checked?: boolean; onChange?: (next: boolean) => void; label?: string; disabled?: boolean; style?: React.CSSProperties }
export declare function Switch(props: SwitchProps): JSX.Element;
