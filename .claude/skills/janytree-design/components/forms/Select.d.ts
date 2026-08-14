/** Native-backed select matching Input height and focus treatment. */
export interface SelectOption { value: string; label: string }
export interface SelectProps { value?: string; onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: SelectOption[]; placeholder?: string; disabled?: boolean; size?: 'sm' | 'md'; style?: React.CSSProperties }
export declare function Select(props: SelectProps): JSX.Element;
