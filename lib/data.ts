export type SampleDataPoint = {
  id?: string;
  label: string;
  value: number;
};

const SAMPLE_DATA: SampleDataPoint[] = [
  { label: 'Jan', value: 33 },
  { label: 'Feb', value: 42 },
  { label: 'Mar', value: 28 },
  { label: 'Apr', value: 51 },
  { label: 'May', value: 44 },
  { label: 'Jun', value: 62 },
];

export async function fetchSampleData(): Promise<SampleDataPoint[]> {
  // Simulate async fetch from in-memory store
  return new Promise((resolve) => setTimeout(() => resolve(SAMPLE_DATA), 120));
}
