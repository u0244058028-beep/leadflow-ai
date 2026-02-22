declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          prompt: string | { role: string; content: string }[],
          options?: {
            model?: string;
            stream?: boolean;
            temperature?: number;
            max_tokens?: number;
          }
        ) => Promise<any>;
      };
      fs: {
        read: (path: string) => Promise<string>;
        write: (path: string, content: string) => Promise<void>;
        list: (path: string) => Promise<string[]>;
      };
      print: (text: string) => void;
    };
  }
}

export {};