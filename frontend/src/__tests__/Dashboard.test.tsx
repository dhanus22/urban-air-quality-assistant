import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../pages/Dashboard';

// Mock the API service so tests run independently
vi.mock('../services/api', () => ({
  api: {
    getAirQuality: vi.fn().mockResolvedValue({
      city: 'Delhi',
      aqi: 165,
      level: 'Unhealthy',
      dominantPollutant: 'PM2.5',
      pollutants: {
        pm25: 165,
        pm10: 95,
        no2: 40,
        o3: 20,
        so2: 12,
        co: 1.2,
      },
      weather: {
        temperature: 24,
        humidity: 55,
        windSpeed: 10,
        condition: 'Hazy',
      },
      healthAdvisory: 'Unhealthy air. Sensitive groups should stay indoors.',
      timestamp: new Date().toISOString(),
      station: 'Central Station #01',
    }),
    getGeoAirQuality: vi.fn(),
  },
}));

describe('Dashboard Page', () => {
  it('renders search input with accessible label', () => {
    render(<Dashboard />);
    const searchInput = screen.getByLabelText(/Search by City or Monitoring Station/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('renders Use My Location and Refresh buttons', () => {
    render(<Dashboard />);
    expect(
      screen.getByLabelText(/Detect air quality using current device GPS location/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Refresh current air quality readings/i)
    ).toBeInTheDocument();
  });

  it('renders popular city suggestion pills', () => {
    render(<Dashboard />);
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
  });

  it('renders air quality metrics and health advisory after loading', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Delhi/i })).toBeInTheDocument();
      expect(screen.getByText('Health Advisory & Risk Level')).toBeInTheDocument();
      expect(screen.getByText('Individual Pollutant Breakdown')).toBeInTheDocument();
    });
  });
});
