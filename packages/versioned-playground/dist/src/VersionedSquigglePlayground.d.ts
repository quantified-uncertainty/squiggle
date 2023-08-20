import { FC, ReactNode } from "react";
type CommonProps = {
    defaultCode?: string;
    distributionChartSettings?: {
        showSummary?: boolean;
    };
    renderExtraControls?: (options: {
        openModal: (name: string) => void;
    }) => ReactNode;
    renderExtraModal?: (name: string) => {
        title: string;
        body: ReactNode;
    } | undefined;
    onCodeChange?: (code: string) => void;
    onSettingsChange?: (settings: {
        distributionChartSettings: {
            showSummary: boolean;
        };
    }) => void;
    height?: string | number;
};
type Props = CommonProps & {
    version: string;
};
export declare const VersionedSquigglePlayground: FC<Props>;
export {};
//# sourceMappingURL=VersionedSquigglePlayground.d.ts.map