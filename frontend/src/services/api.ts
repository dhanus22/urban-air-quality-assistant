import {
  AirQualityData,
  ChatRequest,
  ChatResponse,
  ImpactRequest,
  ImpactResponse,
  IndoorHack,
  IndoorHackRequest,
  IndoorHackResponse,
  RoutineRequest,
  RoutineResponse,
  SearchResult,
} from '../types';
import { getAQILevel, getHealthAdvice } from '../utils/aqi-utils';

export class ApiService {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl?: string, timeoutMs: number = 10000) {
    this.baseUrl = baseUrl || (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.VITE_API_BASE_URL) || '/api/v1';
    this.timeoutMs = timeoutMs;
  }

  /**
   * Helper to perform fetch with 10s timeout, signal merging, and robust error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    userSignal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    // Link user abort signal if provided
    if (userSignal) {
      if (userSignal.aborted) {
        controller.abort();
      } else {
        userSignal.addEventListener('abort', () => controller.abort());
      }
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson && (errorJson.detail || errorJson.message)) {
            errorMessage = errorJson.detail || errorJson.message;
          }
        } catch {
          // Response body was not JSON
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        if (userSignal?.aborted) {
          throw new Error('Request was cancelled by user');
        }
        throw new Error(`Request timed out after ${this.timeoutMs / 1000} seconds`);
      }

      throw error;
    }
  }

  /**
   * Fetch current air quality by city name
   */
  async getAirQuality(city: string, signal?: AbortSignal): Promise<AirQualityData> {
    try {
      return await this.request<AirQualityData>(
        `/air-quality?city=${encodeURIComponent(city)}`,
        { method: 'GET' },
        signal
      );
    } catch (err) {
      // Provide realistic simulated fallback if backend API is not running in demo
      console.warn(`[API] Fallback for getAirQuality("${city}"):`, err);
      return this.getMockAirQuality(city);
    }
  }

  /**
   * Fetch current air quality by GPS latitude and longitude
   */
  async getGeoAirQuality(lat: number, lng: number, signal?: AbortSignal): Promise<AirQualityData> {
    try {
      return await this.request<AirQualityData>(
        `/air-quality/geo?lat=${lat}&lng=${lng}`,
        { method: 'GET' },
        signal
      );
    } catch (err) {
      console.warn(`[API] Fallback for getGeoAirQuality(${lat}, ${lng}):`, err);
      return this.getMockAirQuality('Current Location', lat, lng);
    }
  }

  /**
   * Search stations or cities matching a query
   */
  async searchStations(keyword: string, signal?: AbortSignal): Promise<SearchResult[]> {
    try {
      return await this.request<SearchResult[]>(
        `/stations/search?q=${encodeURIComponent(keyword)}`,
        { method: 'GET' },
        signal
      );
    } catch (err) {
      console.warn(`[API] Fallback for searchStations("${keyword}"):`, err);
      return this.getMockSearchStations(keyword);
    }
  }

  /**
   * Send a message to the AI Air Quality Assistant
   */
  async chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    try {
      return await this.request<ChatResponse>(
        '/chat',
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        signal
      );
    } catch (err) {
      console.warn('[API] Fallback for chat:', err);
      return this.getMockChatReply(request);
    }
  }

  /**
   * Get personalized AI daily routine based on city AQI & lifestyle
   */
  async getRoutines(request: RoutineRequest, signal?: AbortSignal): Promise<RoutineResponse> {
    try {
      return await this.request<RoutineResponse>(
        '/routines',
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        signal
      );
    } catch (err) {
      console.warn('[API] Fallback for routines:', err);
      return this.getMockRoutines(request);
    }
  }

  /**
   * Get indoor air hacks tailored to room type and budget
   */
  async getIndoorHacks(
    request: IndoorHackRequest,
    signal?: AbortSignal
  ): Promise<IndoorHackResponse> {
    try {
      return await this.request<IndoorHackResponse>(
        '/indoor-hacks',
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        signal
      );
    } catch (err) {
      console.warn('[API] Fallback for indoor hacks:', err);
      return this.getMockIndoorHacks(request);
    }
  }

  /**
   * Calculate personal and community carbon and health impact
   */
  async getImpact(request: ImpactRequest, signal?: AbortSignal): Promise<ImpactResponse> {
    try {
      return await this.request<ImpactResponse>(
        '/impact',
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        signal
      );
    } catch (err) {
      console.warn('[API] Fallback for impact calculation:', err);
      return this.getMockImpact(request);
    }
  }

  // ==========================================
  // High-Fidelity Demo Mock Fallbacks
  // ==========================================

  private getMockAirQuality(city: string, lat: number = 28.6139, lng: number = 77.209): AirQualityData {
    // Generate deterministic yet lively values based on city name
    let hash = 0;
    for (let i = 0; i < city.length; i++) {
      hash = (hash << 5) - hash + city.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const mockAqi = 45 + (absHash % 175);
    const level = getAQILevel(mockAqi);

    const pm25 = Math.round(mockAqi * 0.45);
    const pm10 = Math.round(mockAqi * 0.82);
    const o3 = Math.round(30 + (absHash % 45));
    const no2 = Math.round(25 + (absHash % 50));
    const so2 = Math.round(10 + (absHash % 25));
    const co = Number((0.6 + (absHash % 25) / 10).toFixed(1));

    return {
      city: city || 'Metropolitan Area',
      aqi: mockAqi,
      level,
      dominantPollutant: pm25 > 50 ? 'PM2.5' : 'O3',
      pollutants: {
        pm25,
        pm10,
        o3,
        no2,
        so2,
        co,
      },
      weather: {
        temperature: 22 + (absHash % 12),
        humidity: 45 + (absHash % 35),
        windSpeed: 6 + (absHash % 14),
        condition: mockAqi > 150 ? 'Smoky / Haze' : mockAqi > 100 ? 'Partly Cloudy' : 'Clear & Breezy',
      },
      healthAdvisory: getHealthAdvice(level),
      timestamp: new Date().toISOString(),
      coordinates: { lat, lng },
      station: `${city} Central Monitoring Station #04`,
    };
  }

  private getMockSearchStations(query: string): SearchResult[] {
    const list: SearchResult[] = [
      { id: '1', name: 'Downtown Central', city: 'Seattle', aqi: 38, lat: 47.6062, lng: -122.3321 },
      { id: '2', name: 'Connaught Place', city: 'Delhi', aqi: 182, lat: 28.6315, lng: 77.2167 },
      { id: '3', name: 'Bandra Reclamation', city: 'Mumbai', aqi: 115, lat: 19.0596, lng: 72.8295 },
      { id: '4', name: 'Green Park Metro', city: 'London', aqi: 48, lat: 51.5068, lng: -0.1428 },
      { id: '5', name: 'Manhattan Chinatown', city: 'New York', aqi: 54, lat: 40.7158, lng: -73.997 },
      { id: '6', name: 'Shinjuku Gyoen', city: 'Tokyo', aqi: 32, lat: 35.6852, lng: 139.71 },
      { id: '7', name: 'Pudong Riverside', city: 'Shanghai', aqi: 138, lat: 31.2304, lng: 121.4737 },
    ];

    if (!query) return list.slice(0, 4);
    return list.filter(
      (s) =>
        s.city.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockChatReply(request: ChatRequest): ChatResponse {
    const q = request.message.toLowerCase();
    const city = request.city || 'your area';

    if (q.includes('safe to go outside') || q.includes('outdoor')) {
      return {
        reply: `### Air Quality Safety Assessment for **${city}**\n\nBased on prevailing atmospheric readings:\n- **Current Status**: The Air Quality Index indicates moderate to high particulate levels.\n- **Recommendation**: If you are in a sensitive group (asthma, cardiovascular conditions, children, older adults), limit prolonged outdoor physical exertion.\n- **Best Outdoor Window**: The best time for light walks or jogging is typically between **1:00 PM and 4:30 PM**, when thermal inversion lifts and wind dispersion increases.\n- **Protective Gear**: An **N95 or FFP2 respirator** is recommended for commutes during peak traffic.`,
        timestamp: new Date().toISOString(),
        sources: ['WHO Air Quality Guidelines (2021)', 'EPA Clean Air Act Index Standards'],
      };
    }

    if (q.includes('mask') || q.includes('smog')) {
      return {
        reply: `### Recommended Masks for Smog & Particulate Protection\n\n1. **N95 / FFP2 Respirator (Best Choice)**:\n   - Filters at least 95% of airborne particles down to 0.3 microns (including PM2.5 and PM0.1).\n   - Ensure a tight facial seal without air leaks around the nose bridge.\n\n2. **KF94 (Korean Standard)**:\n   - Comparable filtration to N95, with a 3D ergonomic shape that makes breathing and speaking easier.\n\n3. **Cloth or Surgical Masks (Not Recommended)**:\n   - Surgical masks only capture large droplets (>10 microns) and offer **less than 20% protection** against fine PM2.5 smoke.\n\n> 💡 *Pro Tip: Replace disposable respirators after ~40 cumulative hours of use, or sooner if breathing resistance noticeably increases.*`,
        timestamp: new Date().toISOString(),
        sources: ['NIOSH Respiratory Protection Standards', 'CDC/NIOSH NPPTL Research'],
      };
    }

    if (q.includes('children') || q.includes('protect my child')) {
      return {
        reply: `### Protecting Children from Urban Air Pollution\n\nChildren are particularly vulnerable because they breathe faster relative to their body weight and their lungs are still developing.\n\n- **Create a Clean Sleeping Sanctuary**: Keep an indoor HEPA purifier running in their bedroom overnight.\n- **Adjust School Commutes**: Keep vehicle windows closed with recirculated AC while in congested school drop-off zones.\n- **Hydration & Nutrition**: Antioxidant-rich diets (Vitamin C, Vitamin E, Omega-3s) help mitigate cellular oxidative stress from particulate matter.\n- **Check AQI Before Recess**: If AQI exceeds 150, request indoor activities instead of outdoor sports.`,
        timestamp: new Date().toISOString(),
        sources: ['American Academy of Pediatrics (AAP) Environmental Health Committee'],
      };
    }

    if (q.includes('plant') || q.includes('purify')) {
      return {
        reply: `### Top Indoor Plants for Air Purification\n\nAccording to the NASA Clean Air Study, these plants effectively absorb VOCs (benzene, formaldehyde, trichloroethylene):\n\n1. **Snake Plant (Sansevieria)**: Produces oxygen at night and removes formaldehyde and xylene. Extremely hardy.\n2. **Spider Plant (Chlorophytum comosum)**: Safe for pets, filters carbon monoxide and toluene.\n3. **Peace Lily (Spathiphyllum)**: High transpiration rate, eliminates benzene and airborne mold spores.\n4. **Areca Palm**: Natural humidifier, removes harmful VOCs in spacious living rooms.\n\n> ⚠️ *Note: While plants enhance humidity and absorb trace VOCs, they do not replace a true HEPA filter for microscopic PM2.5 dust!*`,
        timestamp: new Date().toISOString(),
        sources: ['NASA Clean Air Study (Wolverton et al.)'],
      };
    }

    return {
      reply: `### Urban Air Quality Insights for **${city}**\n\nThank you for reaching out! Here are actionable tips to protect your health:\n\n- Monitor the **hourly PM2.5 curve** before planning outdoor jogs or sports.\n- Check weather forecasts for wind shear and thermal inversions.\n- Maintain indoor relative humidity between **40% and 55%** to suppress resuspension of dust particles.\n\nFeel free to ask about specific masks, indoor DIY purifiers, or daily workout planning!`,
      timestamp: new Date().toISOString(),
      sources: ['Urban Air Quality Assistant Knowledge Base'],
    };
  }

  private getMockRoutines(request: RoutineRequest): RoutineResponse {
    const lifestyle = request.lifestyle || 'Urban Professional';
    return {
      city: request.city || 'Metro Region',
      lifestyle,
      aqiSummary: 'Moderate to elevated morning pollution expected. Follow this schedule to minimize toxic inhalation.',
      routines: [
        {
          time: '07:00 AM - 08:00 AM',
          activity: 'Morning Fitness & Wakeup Routine',
          emissionImpact: 'Low',
          sustainableAlternative: 'Perform indoor yoga or home workout instead of high-exertion outdoor running near traffic.',
          healthTip: 'Morning inversions trap vehicular particulate matter close to the surface until sunrise warms the ground.',
        },
        {
          time: '08:30 AM - 09:30 AM',
          activity: 'Workplace Commute',
          emissionImpact: 'High',
          sustainableAlternative: 'Opt for metro rail, electric transit, or carpooling instead of driving a single-occupancy petrol vehicle.',
          healthTip: 'Wear an N95 respirator when walking through arterial road intersections.',
        },
        {
          time: '12:30 PM - 01:30 PM',
          activity: 'Lunch & Fresh Air Break',
          emissionImpact: 'Low',
          sustainableAlternative: 'Visit an urban park or rooftop garden with dense canopy foliage.',
          healthTip: 'Atmospheric boundary layer is highest in early afternoon, making outdoor PM concentration lowest.',
        },
        {
          time: '05:30 PM - 06:30 PM',
          activity: 'Evening Return Commute',
          emissionImpact: 'High',
          sustainableAlternative: 'Stagger departure by 30 minutes to avoid idling in gridlock emissions, or use rapid bus transit.',
          healthTip: 'Set car ventilation to internal recirculation mode to block diesel soot from entering cabin.',
        },
        {
          time: '08:00 PM - 10:00 PM',
          activity: 'Home Relaxation & Dinner Preparation',
          emissionImpact: 'Medium',
          sustainableAlternative: 'Use induction stove or clean electric cooking instead of open high-smoke frying.',
          healthTip: 'Run kitchen exhaust fan for at least 10 minutes post-cooking to eliminate ultrafine cooking aerosols.',
        },
      ],
    };
  }

  private getMockIndoorHacks(request: IndoorHackRequest): IndoorHackResponse {
    const hacks: IndoorHack[] = [
      {
        id: 'hack-1',
        title: 'Corsi-Rosenthal Box Air Purifier',
        description: 'Build a high-volume, low-cost HEPA-equivalent air filter using a 20-inch box fan and MERV 13 furnace filters.',
        effectiveness: 'High',
        cost: request.budget === 'Low' ? 'Low' : 'Low',
        roomType: request.roomType,
        estimatedImprovement: 'Cleans 85-92% of PM2.5 in 25 minutes',
        steps: [
          'Purchase one 20x20 inch box fan and four MERV 13 furnace filters.',
          'Form a cube using the four filters facing inwards with airflow arrows pointing into the box.',
          'Tape the edges securely with duct tape or painter tape to eliminate air bypass.',
          'Fasten the fan on top blowing upwards, and place cardboard on the bottom base.',
          'Plug in and run on medium speed for whisper-quiet continuous filtration.',
        ],
      },
      {
        id: 'hack-2',
        title: 'Draft Stopper & Door Sweep Sealing',
        description: 'Prevent street dust and corridor pollution from infiltrating your living quarters under doors and window gaps.',
        effectiveness: 'Medium',
        cost: 'Low',
        roomType: request.roomType,
        estimatedImprovement: 'Reduces outdoor particle ingress by 35%',
        steps: [
          'Inspect door bottom and window frame edges with a candle or tissue paper for air currents.',
          'Install silicone or twin-draft foam door sweeps along the main entrance.',
          'Apply self-adhesive foam weatherstripping tape along window perimeter joints.',
        ],
      },
      {
        id: 'hack-3',
        title: 'Targeted Cross-Ventilation Timing',
        description: 'Flush out indoor CO2 and moisture during the daily atmospheric peak cleanliness window.',
        effectiveness: 'Medium',
        cost: 'Low',
        roomType: request.roomType,
        estimatedImprovement: 'Drops indoor CO2 below 700 ppm without spiking PM2.5',
        steps: [
          'Check the real-time AQI around 1:00 PM to 3:00 PM.',
          'Open two opposite windows for exactly 10-15 minutes to generate rapid laminar air displacement.',
          'Close windows tightly and resume running your indoor air filter.',
        ],
      },
      {
        id: 'hack-4',
        title: 'Activated Carbon Odor & VOC Neutralizer',
        description: 'Passive activated bamboo charcoal sacks placed in closets, bathrooms, and cooking zones.',
        effectiveness: 'Medium',
        cost: 'Low',
        roomType: request.roomType,
        estimatedImprovement: 'Absorbs up to 60% of volatile organic scents and formaldehyde',
        steps: [
          'Place 200g-500g activated charcoal bags near high VOC emitting sources (new furniture, kitchen).',
          'Recharge the charcoal once per month by placing the bags in direct sunlight for 2 hours.',
        ],
      },
    ];

    return {
      hacks,
      summary: `Filtered hacks optimized for ${request.roomType || 'Living Room'} with ${request.budget || 'Low'} budget. Implementing these methods can drastically lower particulate exposure indoors.`,
    };
  }

  private getMockImpact(request: ImpactRequest): ImpactResponse {
    const habitsCount = request.currentHabits?.length || 2;
    const changesCount = request.proposedChanges?.length || 2;

    const baseCo2PerChange = 185; // kg CO2 / year
    const co2ReductionKg = Math.round(changesCount * baseCo2PerChange + habitsCount * 45);

    const tips: string[] = [
      'Switching to electric transport or subway saves ~2.4 metric tons of greenhouse gas emissions annually.',
      'Regular HEPA filtration reduces systemic circulatory inflammatory biomarkers by up to 28%.',
      'Ceasing leaf and municipal waste burning spares neighborhood children from severe respiratory distress.',
      'Transitioning to induction cooking eliminates indoor nitrogen dioxide spikes.',
    ];

    return {
      co2ReductionKg,
      healthBenefit: `Projected 34% reduction in personal respiratory irritation risks and noticeable cardiovascular stress reduction.`,
      communityImpact: `If 500 neighbors adopt these changes, your neighborhood prevents ${Math.round((co2ReductionKg * 500) / 1000)} metric tons of CO2 emissions annually!`,
      actionableTips: tips.slice(0, Math.max(2, changesCount + 1)),
      beforeScore: 42,
      afterScore: Math.min(96, 42 + changesCount * 12),
    };
  }
}

export const api = new ApiService();
