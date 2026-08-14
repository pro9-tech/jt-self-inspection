/** Form scaffolding — labelled field rows, card sections, and a sticky bottom action bar. */
export interface FieldProps { label?: string; required?: boolean; hint?: string; error?: string; children?: React.ReactNode; style?: React.CSSProperties }
export declare function Field(props: FieldProps): JSX.Element;
export interface FormSectionProps { title?: string; description?: string; children?: React.ReactNode; style?: React.CSSProperties }
export declare function FormSection(props: FormSectionProps): JSX.Element;
export interface FormActionsProps { children?: React.ReactNode; style?: React.CSSProperties }
export declare function FormActions(props: FormActionsProps): JSX.Element;
