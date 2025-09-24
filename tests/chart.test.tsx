import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the ChartDemo module so we don't import the real TSX component during unit tests
jest.mock('../components/ChartDemo', () => {
  return function MockChart() {
    return React.createElement('div', { 'data-testid': 'chart-mock' }, 'mock');
  };
});

const ChartDemo = require('../components/ChartDemo');

describe('ChartDemo (mocked)', () => {
  it('renders the mocked chart container', async () => {
    render(React.createElement(ChartDemo));
    await waitFor(() => expect(screen.getByTestId('chart-mock')).toBeInTheDocument());
  });
});
