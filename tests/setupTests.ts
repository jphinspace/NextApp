import '@testing-library/jest-dom';
// Mock react-chartjs-2 to render a simple div for testing
import React from 'react';

jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => {
    return React.createElement('div', { 'data-testid': 'chart-mock' });
  },
}));

// Mock chart.js since it's heavy and may use non-JS modules
jest.mock('chart.js', () => ({
  Chart: () => ({}),
}));
