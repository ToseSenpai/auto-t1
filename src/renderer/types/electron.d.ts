/// <reference types="react" />

// Extend JSX to support webview tag in React/TypeScript
declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        // Core attributes
        src?: string;
        partition?: string;
        httpreferrer?: string;
        useragent?: string;
        preload?: string;

        // Feature toggles
        allowpopups?: string | boolean;
        nodeintegration?: string | boolean;
        nodeintegrationinsubframes?: string | boolean;
        plugins?: string | boolean;
        disablewebsecurity?: string | boolean;
        disableblinkfeatures?: string;
        enableblinkfeatures?: string;
        webpreferences?: string;

        // Methods available on webview element
        loadURL?: (url: string) => void;
        getURL?: () => string;
        getTitle?: () => string;
        isLoading?: () => boolean;
        isLoadingMainFrame?: () => boolean;
        isWaitingForResponse?: () => boolean;
        stop?: () => void;
        reload?: () => void;
        reloadIgnoringCache?: () => void;
        canGoBack?: () => boolean;
        canGoForward?: () => boolean;
        canGoToOffset?: (offset: number) => boolean;
        clearHistory?: () => void;
        goBack?: () => void;
        goForward?: () => void;
        goToIndex?: (index: number) => void;
        goToOffset?: (offset: number) => void;
        isCrashed?: () => boolean;
        setUserAgent?: (userAgent: string) => void;
        getUserAgent?: () => string;
        insertCSS?: (css: string) => void;
        executeJavaScript?: (code: string) => Promise<any>;
        openDevTools?: () => void;
        closeDevTools?: () => void;
        isDevToolsOpened?: () => boolean;
        isDevToolsFocused?: () => boolean;
        inspectElement?: (x: number, y: number) => void;
        setAudioMuted?: (muted: boolean) => void;
        isAudioMuted?: () => boolean;
        undo?: () => void;
        redo?: () => void;
        cut?: () => void;
        copy?: () => void;
        paste?: () => void;
        pasteAndMatchStyle?: () => void;
        delete?: () => void;
        selectAll?: () => void;
        unselect?: () => void;
        replace?: (text: string) => void;
        replaceMisspelling?: (text: string) => void;
        insertText?: (text: string) => void;
        findInPage?: (text: string, options?: any) => number;
        stopFindInPage?: (action: string) => void;
        print?: (options?: any) => void;
        printToPDF?: (options: any) => Promise<Buffer>;
        capturePage?: (rect?: any) => Promise<any>;
        send?: (channel: string, ...args: any[]) => void;
        sendInputEvent?: (event: any) => void;
        setZoomFactor?: (factor: number) => void;
        setZoomLevel?: (level: number) => void;
        getZoomLevel?: () => number;
        getZoomFactor?: () => number;
        showDefinitionForSelection?: () => void;
        getWebContentsId?: () => number;
      },
      HTMLElement
    >;
  }
}

// ElectronAPI interface matching preload.ts
export interface ElectronAPI {
  selectExcelFile: () => Promise<{
    success: boolean;
    filePath?: string;
    fileName?: string;
    cancelled?: boolean;
    error?: string;
  }>;
  startAutomation: (data: {
    username: string;
    password: string;
    excelPath: string;
  }) => Promise<{ success: boolean; error?: string }>;
  processRows: () => Promise<{
    success: boolean;
    error?: string;
    stats?: { total: number; success: number; errors: number };
  }>;
  stopAutomation: () => Promise<{ success: boolean; error?: string }>;
  getAutomationUrl: () => Promise<{ success: boolean; url: string }>;
  checkMrnRange: (data: {
    username: string;
    password: string;
    excelPath: string;
  }) => Promise<{ success: boolean; count?: number; error?: string }>;
  onStatus: (callback: (data: { type: string; message: string }) => void) => void;
  onProgress: (
    callback: (data: { current: number; total: number; rowData: any }) => void
  ) => void;
  removeStatusListener: () => void;
  removeProgressListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
