import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AQIGauge from '../components/AQIGauge';

describe('AQIGauge Component', () => {
  it('renders with correct AQI numeric value and label', () => {
    render(<AQIGauge aqi={42} />);

    expect(screen.getByTestId('aqi-value')).toHaveTextContent('42');
    expect(screen.getByTestId('aqi-level-label')).toHaveTextContent('Good');
  });

  it('displays correct level labels across ranges', () => {
    const { rerender } = render(<AQIGauge aqi={85} />);
    expect(screen.getByTestId('aqi-level-label')).toHaveTextContent('Moderate');

    rerender(<AQIGauge aqi={130} />);
    expect(screen.getByTestId('aqi-level-label')).toHaveTextContent(
      'Unhealthy for Sensitive Groups'
    );

    rerender(<AQIGauge aqi={180} />);
    expect(screen.getByTestId('aqi-level-label')).toHaveTextContent('Unhealthy');

    rerender(<AQIGauge aqi={250} />);
    expect(screen.getByTestId('aqi-level-label')).toHaveTextContent('Very Unhealthy');

    rerender(<AQIGauge aqi={350} />);
    expect(screen.getByTestId('aqi-level-label')).toHaveTextContent('Hazardous');
  });

  it('implements standard accessible meter attributes (ARIA)', () => {
    render(<AQIGauge aqi={156} />);

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '156');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '500');
    expect(meter).toHaveAttribute('aria-valuetext', '156 AQI, Unhealthy');
  });

  it('renders small and large size variants', () => {
    const { rerender } = render(<AQIGauge aqi={42} size="sm" />);
    expect(screen.getByTestId('aqi-gauge')).toHaveClass('w-44');

    rerender(<AQIGauge aqi={42} size="lg" />);
    expect(screen.getByTestId('aqi-gauge')).toHaveClass('w-72');
  });
});
