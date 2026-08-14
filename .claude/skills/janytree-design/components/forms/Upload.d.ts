/** Dashed drop zone for MSDS / 자료 uploads, with optional progress bar and file list. */
export interface UploadFile { name: string; size?: string }
export interface UploadProps { label?: string; hint?: string; files?: UploadFile[]; onPick?: (e: any) => void; progress?: number; style?: React.CSSProperties }
export declare function Upload(props: UploadProps): JSX.Element;
