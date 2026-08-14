/** Label–value grid for record metadata (품목 기본정보, 문서 헤더). */
export interface DescriptionItem { label: string; value: React.ReactNode; numeric?: boolean; span?: number }
export interface DescriptionsProps { items: DescriptionItem[]; columns?: number; style?: React.CSSProperties }
export declare function Descriptions(props: DescriptionsProps): JSX.Element;
