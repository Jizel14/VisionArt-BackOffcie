export type CopilotMessageRole = "user" | "assistant" | "system";

export type CopilotMessage = {
  id: string;
  role: CopilotMessageRole;
  content: string;
  createdAt: number;
};

export type CopilotResultKind = "metric" | "table" | "bar";

export type CopilotMetric = {
  label: string;
  value: number | string;
};

export type CopilotTable = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export type CopilotBarChart = {
  xKey: string;
  yKey: string;
  data: Record<string, unknown>[];
};

export type CopilotResponse = {
  sql: string;
  kind: CopilotResultKind;
  metric?: CopilotMetric;
  table?: CopilotTable;
  chart?: CopilotBarChart;
};

