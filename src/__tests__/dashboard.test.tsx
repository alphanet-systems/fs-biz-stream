import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/page';

// Mock recharts because it doesn't play well with Jest out of the box
jest.mock('recharts', () => {
    const OriginalModule = jest.requireActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div style={{ width: '100%', height: '100%' }} data-testid="responsive-container">
                {children}
            </div>
        ),
        BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
        Bar: () => <div data-testid="bar" />,
        XAxis: () => <div data-testid="xaxis" />,
        YAxis: () => <div data-testid="yaxis" />,
        CartesianGrid: () => <div data-testid="cartesian-grid" />,
        Tooltip: () => <div data-testid="tooltip" />,
    };
});

describe('DashboardPage', () => {
  it('renders the main dashboard heading', () => {
    render(<DashboardPage />);
    const heading = screen.getByRole('heading', {
      name: /dashboard/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the four main stat cards', () => {
    render(<DashboardPage />);
    
    const revenueCard = screen.getByText(/total revenue/i);
    const expensesCard = screen.getByText(/total expenses/i);
    const profitCard = screen.getByText(/profit/i);
    const pendingSalesCard = screen.getByText(/pending sales/i);

    expect(revenueCard).toBeInTheDocument();
    expect(expensesCard).toBeInTheDocument();
    expect(profitCard).toBeInTheDocument();
    expect(pendingSalesCard).toBeInTheDocument();
  });

  it('renders the Profit vs. Expenses chart', () => {
    render(<DashboardPage />);
    const chartTitle = screen.getByRole('heading', { name: /profit vs\. expenses/i });
    expect(chartTitle).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders the Recent Sales table', () => {
    render(<DashboardPage />);
    const tableTitle = screen.getByRole('heading', { name: /recent sales/i });
    expect(tableTitle).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Check for a header cell
    const clientHeader = screen.getByRole('columnheader', { name: /client/i });
    expect(clientHeader).toBeInTheDocument();
  });
});
