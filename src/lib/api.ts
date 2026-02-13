// FastAPI Backend Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PredictionRequest {
  home_team: string;
  away_team: string;
}

export interface PredictionResponse {
  home_team: string;
  away_team: string;
  home_win: number;
  draw: number;
  away_win: number;
  prediction: string;
  confidence: string;
}

export interface Fixture {
  id: number;
  home_team: string;
  away_team: string;
  date: string;
  time: string;
  venue: string;
  is_hot_match?: boolean;
  prediction?: {
    home_win: number;
    draw: number;
    away_win: number;
    predicted: string;
  };
}

export interface UserFeedback {
  fixture_id: number;
  home_team: string;
  away_team: string;
  user_prediction: 'home_win' | 'draw' | 'away_win';
  user_email?: string;
}

export interface ModelStatus {
  status: string;
  accuracy?: number;
  last_trained?: string;
  total_predictions?: number;
}

// Helper function to convert confidence float to string
const confidenceToString = (confidence: number): string => {
  if (confidence >= 0.6) return 'High';
  if (confidence >= 0.4) return 'Medium';
  return 'Low';
};

// Helper function to normalize predicted outcome
const normalizePrediction = (outcome: string): string => {
  const mapping: Record<string, string> = {
    'Home': 'Home Win',
    'Draw': 'Draw',
    'Away': 'Away Win',
  };
  return mapping[outcome] || outcome;
};

// Prediction API
export const getPrediction = async (homeTeam: string, awayTeam: string): Promise<PredictionResponse> => {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      home_team: homeTeam,
      away_team: awayTeam,
    }),
  });

  if (!response.ok) {
    throw new Error(`Prediction failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform backend response to frontend format
  return {
    home_team: data.home_team,
    away_team: data.away_team,
    home_win: data.probabilities?.Home || 0,
    draw: data.probabilities?.Draw || 0,
    away_win: data.probabilities?.Away || 0,
    prediction: normalizePrediction(data.predicted_outcome || ''),
    confidence: confidenceToString(data.confidence || 0),
  };
};

// Helper function to parse date and extract date/time strings
const parseFixtureDate = (dateStr: string): { date: string; time: string } => {
  try {
    const date = new Date(dateStr);
    const datePart = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const timePart = date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    return { date: datePart, time: timePart };
  } catch {
    return { date: dateStr, time: '15:00' }; // Default time
  }
};

// Helper function to determine if match is "hot" (high-profile teams or high confidence)
const isHotMatch = (homeTeam: string, awayTeam: string, confidence?: number): boolean => {
  const hotMatchTeams = [
    'Orlando Pirates',
    'Kaizer Chiefs', 
    'Mamelodi Sundowns',
    'AmaZulu',
    'Golden Arrows',
    'TS Galaxy',
    'Richards Bay'
  ];
  
  // Normalize team names for comparison (case-insensitive, remove extra spaces)
  const normalizeTeam = (team: string) => team.toLowerCase().trim();
  const normalizedHome = normalizeTeam(homeTeam);
  const normalizedAway = normalizeTeam(awayTeam);
  
  // Check if either team matches any hot team (case-insensitive, partial match)
  const isHotTeam = hotMatchTeams.some(team => {
    const normalizedHotTeam = normalizeTeam(team);
    return normalizedHome.includes(normalizedHotTeam) || 
           normalizedAway.includes(normalizedHotTeam) ||
           normalizedHotTeam.includes(normalizedHome) ||
           normalizedHotTeam.includes(normalizedAway);
  });
  
  return isHotTeam || (confidence !== undefined && confidence > 0.5);
};

// Fixtures API
// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to save auth token to localStorage
export const saveAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Helper function to remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

export const getFixtures = async (days: number = 14, limit: number = 5): Promise<Fixture[]> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in to view fixtures.');
  }

  const response = await fetch(`${API_BASE_URL}/fixtures?days=${days}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    let errorMessage = `Failed to fetch fixtures: ${response.status}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const fixtures = data.fixtures || [];
  
  // Transform backend response to frontend format
  return fixtures.map((fixture: any, index: number) => {
    // Backend now provides date and time separately
    const date = fixture.date || '';
    const time = fixture.time || '15:00';
    const probabilities = fixture.probabilities || {};
    
    return {
      id: fixture.id || index + 1,
      home_team: fixture.home_team,
      away_team: fixture.away_team,
      date,
      time,
      venue: fixture.venue || '',
      is_hot_match: isHotMatch(fixture.home_team, fixture.away_team, fixture.confidence),
      prediction: probabilities.Home !== undefined ? {
        home_win: probabilities.Home,
        draw: probabilities.Draw || 0,
        away_win: probabilities.Away || 0,
        predicted: normalizePrediction(fixture.predicted_outcome || ''),
      } : undefined,
    };
  });
};

// User Feedback API
export const submitUserFeedback = async (feedback: UserFeedback): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit feedback: ${response.statusText}`);
  }

  return response.json();
};

// Model Status API
export const getModelStatus = async (): Promise<ModelStatus> => {
  const response = await fetch(`${API_BASE_URL}/model/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch model status: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform backend response to frontend format
  let status: string = 'offline';
  if (data.trained === true) {
    status = 'ready';
  } else if (data.trained === false) {
    status = 'offline';
  }
  
  // Extract accuracy from model_params if available (could be calculated from calibration)
  const accuracy = data.model_params?.calibrated ? 0.75 : undefined; // Placeholder, could be improved
  
  return {
    status,
    accuracy,
    last_trained: data.model_params ? new Date().toISOString() : undefined, // Placeholder
    total_predictions: data.teams_count,
  };
};

// Teams API
export interface Team {
  name: string;
  value: string;
}

export const getTeams = async (): Promise<Team[]> => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.statusText}`);
  }

  const data = await response.json();
  const teams = data.teams || [];
  
  // Transform backend team names to frontend format
  // Convert team names to value format (lowercase with underscores)
  return teams.map((teamName: string) => ({
    name: teamName,
    value: teamName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
  }));
};

// Content API
export const getAboutContent = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/content/about`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch about content: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content || '';
};

export const getDisclaimerContent = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/content/disclaimer`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch disclaimer content: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content || '';
};

export const getContactContent = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/content/contact`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch contact content: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content || '';
};

// Authentication API
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: number;
  access_token?: string;
  token_type?: string;
}

export const registerUser = async (email: string, password: string): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Registration failed: ${response.statusText}`);
  }

  return response.json();
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Login failed: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Save token to localStorage if login successful
  if (result.access_token) {
    saveAuthToken(result.access_token);
  }
  
  return result;
};

// Logout function
export const logoutUser = (): void => {
  removeAuthToken();
};

// Benchmark API
export interface BenchmarkMatch {
  id: number;
  home_team: string;
  away_team: string;
  date: string;
  predicted_outcome: string;
  actual_outcome: string | null;
  actual_score: string | null;
  correct: boolean | null;
  confidence: string;
}

export interface BenchmarkSummary {
  total_matches: number;
  correct: number;
  incorrect: number;
  pending: number;
  accuracy: number;
  accuracy_by_confidence?: { confidence: string; accuracy: number; count: number }[];
}

export interface BenchmarkResponse {
  summary: BenchmarkSummary;
  matches: BenchmarkMatch[];
}

export const getBenchmarkResults = async (): Promise<BenchmarkResponse> => {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/benchmark`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch benchmark: ${errorText}`);
  }

  return response.json();
};

// Health Check
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
};
