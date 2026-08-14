/** Loading placeholders — shimmering skeleton blocks and a spinning indicator. */
export interface SkeletonProps { width?: string | number; height?: string | number; radius?: string; style?: React.CSSProperties }
export declare function Skeleton(props: SkeletonProps): JSX.Element;
export interface SpinProps { size?: number; style?: React.CSSProperties }
export declare function Spin(props: SpinProps): JSX.Element;
