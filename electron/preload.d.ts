export interface ElectronAPI {
    startAutomation: (data: {
        username: string;
        password: string;
        excelPath: string;
    }) => Promise<{
        success: boolean;
        error?: string;
    }>;
    processRows: () => Promise<{
        success: boolean;
        error?: string;
        stats?: {
            total: number;
            success: number;
            errors: number;
        };
    }>;
    stopAutomation: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    onStatus: (callback: (data: {
        type: string;
        message: string;
    }) => void) => void;
    onProgress: (callback: (data: {
        current: number;
        total: number;
        rowData: any;
    }) => void) => void;
    removeStatusListener: () => void;
    removeProgressListener: () => void;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
//# sourceMappingURL=preload.d.ts.map