/**
 * Types for Chart.js integration with PrimeNG
 */

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
  fill?: boolean;
  borderDash?: number[];
  pointRadius?: number;
}

export interface ChartOptions {
  plugins: {
    legend: {
      labels: {
        color: string;
      };
    };
    tooltip: {
      callbacks: {
        label: (context: ChartTooltipContext) => string;
      };
    };
  };
  scales: {
    x: {
      ticks: {
        color: string;
        maxRotation: number;
        minRotation: number;
      };
      grid: {
        color: string;
      };
    };
    y: {
      ticks: {
        color: string;
        callback: (value: number | string) => string;
      };
      grid: {
        color: string;
      };
    };
  };
  responsive: boolean;
  maintainAspectRatio: boolean;
}

export interface ChartTooltipContext {
  parsed: {
    y: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ChartCallbackContext {
  parsed: {
    y: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

