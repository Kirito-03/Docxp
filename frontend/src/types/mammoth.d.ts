declare module 'mammoth' {
  export interface ConvertOptions {
    arrayBuffer: ArrayBuffer;
  }
  
  export interface ConvertResult {
    value: string; // The generated HTML
    messages: any[]; // Any messages, such as warnings during conversion
  }

  export function convertToHtml(input: ConvertOptions, options?: any): Promise<ConvertResult>;
}
