export interface ConversionResult {
  success: boolean;
  data?: Blob;
  fileName?: string;
  error?: string;
}

export type ConversionProgress = (percent: number) => void;
