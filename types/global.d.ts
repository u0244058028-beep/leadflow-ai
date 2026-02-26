export {};

declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: {
        page_path?: string;
        value?: number;
        currency?: string;
        [key: string]: any;
      }
    ) => void;
    dataLayer: any[];
  }
}