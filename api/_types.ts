export interface ApiRequest {
  query: Record<string, string | string[]>;
  body: any;
  headers: Record<string, string | string[] | undefined>;
  method?: string;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
  send?: (data: any) => void;
  setHeader?: (key: string, value: string) => void;
}
