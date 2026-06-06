import { z } from 'zod';
import { devError } from '@wc/lib/logger';

// FastAPI Backend Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Human-friendly API host label (used in status panels).
export const API_HOST_LABEL = (() => {
  try {
    return new URL(API_BASE_URL).host;
  } catch {
    return API_BASE_URL;
  }
})();

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

// Zod schema for validating user feedback before submission
const UserFeedbackSchema = z.object({
  fixture_id: z.number().int().positive(),
  home_team: z.string().min(1).max(100),
  away_team: z.string().min(1).max(100),
  user_prediction: z.enum(['home_win', 'draw', 'away_win']),
  user_email: z.string().email().optional(),
});

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
    devError('Prediction request failed:', response.status, response.statusText);
    throw new Error('Unable to generate prediction. Please try again later.');
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

// Helper function to determine if match is "hot" (high-profile FIFA nations or high confidence)
const isHotMatch = (homeTeam: string, awayTeam: string, confidence?: number): boolean => {
  const hotMatchTeams = [
    'Argentina',
    'France',
    'Spain',
    'England',
    'Brazil',
    'Portugal',
    'Netherlands',
    'Germany',
    'Italy',
    'Belgium',
    'Croatia',
    'Morocco',
    'USA',
    'Mexico',
    'Canada',
  ];
  
  const normalizeTeam = (team: string) => team.toLowerCase().trim();
  const normalizedHome = normalizeTeam(homeTeam);
  const normalizedAway = normalizeTeam(awayTeam);
  
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

const authHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Helper function to save auth token to localStorage
export const saveAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Helper function to remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Helper function to check if user is authenticated (validates JWT expiry when present)
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
        removeAuthToken();
        return false;
      }
    }
    return true;
  } catch {
    // Opaque (non-JWT) token — treat presence as authenticated
    return true;
  }
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
    const errorText = await response.text().catch(() => '');
    devError('Fixtures request failed:', response.status, errorText);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Unable to load fixtures. Please try again later.');
  }

  const data = await response.json();
  const fixtures = data.fixtures || [];
  
  return fixtures.map((fixture: any, index: number) => {
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
  // Validate feedback before sending
  const validated = UserFeedbackSchema.parse(feedback);

  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validated),
  });

  if (!response.ok) {
    devError('Feedback submission failed:', response.status, response.statusText);
    throw new Error('Unable to submit feedback. Please try again later.');
  }

  return response.json();
};

// Model Status API
export const getModelStatus = async (): Promise<ModelStatus> => {
  const response = await fetch(`${API_BASE_URL}/model/status`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    devError('Model status request failed:', response.status, errorText);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Unable to fetch model status. Please try again later.');
  }

  const data = await response.json();
  
  let status: string = 'offline';
  if (data.trained === true) {
    status = 'ready';
  } else if (data.trained === false) {
    status = 'offline';
  }
  
  const accuracy = data.model_params?.calibrated ? 0.75 : undefined;
  
  return {
    status,
    accuracy,
    last_trained: data.model_params ? new Date().toISOString() : undefined,
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
    devError('Teams request failed:', response.status, response.statusText);
    throw new Error('Unable to load teams. Please try again later.');
  }

  const data = await response.json();
  const teams = data.teams || [];
  
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
    devError('About content request failed:', response.status, response.statusText);
    throw new Error('Unable to load content. Please try again later.');
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
    devError('Disclaimer content request failed:', response.status, response.statusText);
    throw new Error('Unable to load content. Please try again later.');
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
    devError('Contact content request failed:', response.status, response.statusText);
    throw new Error('Unable to load content. Please try again later.');
  }

  const data = await response.json();
  return data.content || '';
};

// Authentication API
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: number;
}

export interface LoginRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: number;
  username?: string;
  access_token?: string;
  token_type?: string;
}

export const registerUser = async (username: string, email: string, password: string): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    devError('Registration failed:', response.status);
    if (response.status === 409 || error.detail?.toLowerCase().includes('exists')) {
      throw new Error('An account with this email already exists.');
    }
    throw new Error('Registration failed. Please try again later.');
  }

  return response.json();
};

export const loginUser = async (username: string, email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    devError('Login failed:', response.status);
    if (response.status === 401) {
      throw new Error('Invalid email or password.');
    }
    throw new Error('Login failed. Please try again later.');
  }

  const result = await response.json();
  
  if (result.access_token) {
    saveAuthToken(result.access_token);
  }
  
  return result;
};

// Logout function
export const logoutUser = (): void => {
  removeAuthToken();
};

// Password reset
export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    devError('Forgot password failed:', response.status);
    throw new Error('Unable to send reset email. Please try again later.');
  }

  return response.json().catch(() => ({ message: 'If an account exists, a reset link has been sent.' }));
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: password }),
  });

  if (!response.ok) {
    devError('Reset password failed:', response.status);
    if (response.status === 400 || response.status === 401 || response.status === 410) {
      throw new Error('This reset link is invalid or has expired. Please request a new one.');
    }
    throw new Error('Unable to reset password. Please try again later.');
  }

  return response.json().catch(() => ({ message: 'Password updated.' }));
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
  accuracy_by_period?: { period: string; accuracy: number; correct: number; total: number }[];
}

export interface BenchmarkResponse {
  summary: BenchmarkSummary;
  matches: BenchmarkMatch[];
  message?: string;
}

export const getBenchmarkResults = async (): Promise<BenchmarkResponse> => {
  const response = await fetch(`${API_BASE_URL}/benchmark`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    devError('Benchmark request failed:', response.status, errorText);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Unable to load benchmark data. Please try again later.');
  }

  return response.json();
};

export const triggerScrapeRefresh = async (wait = false): Promise<{ message: string }> => {
  const url = `${API_BASE_URL}/scrape/refresh${wait ? '?wait=true' : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Unable to trigger scrape refresh.');
  }

  return response.json();
};

// Twitter Feed API (Fan Zone)
export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  url: string;
  metrics?: { like_count?: number; retweet_count?: number };
}

export interface TwitterFeedResponse {
  tweets: TwitterTweet[];
  error?: string;
}

export const getTwitterFeed = async (handle: string = 'OfficialPSL'): Promise<TwitterFeedResponse> => {
  const username = handle.replace(/^@/, '');
  const response = await fetch(`${API_BASE_URL}/twitter/feed?handle=${encodeURIComponent(username)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    return { tweets: [], error: 'Unable to load Twitter feed.' };
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

// =====================================================================
// Group Standings API (FIFA World Cup 2026 — scraped daily by backend)
// =====================================================================
//
// Backend contract (FastAPI):
//   GET  /groups/standings           -> GroupStandingsResponse
//   POST /groups/standings/refresh   -> { message: string, updated_at: string }
//
// Recommended backend behaviour:
//   - A daily cron (APScheduler / Celery beat) scrapes
//     https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/groups
//     and persists rows in a `group_standings` table.
//   - Cron runs once every 24h, and additionally every 30 min on dates
//     where a fixture is being played (derive from the fixtures table).
//   - Response includes `updated_at` so the UI can show freshness.
//   - If the tournament hasn't started, return all teams with zeroed
//     stats and `tournament_started: false`.

export interface GroupStandingTeam {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  rank?: number;
}

export interface GroupStanding {
  group: string;              // e.g. "Group A"
  teams: GroupStandingTeam[];
}

export interface GroupStandingsResponse {
  groups: GroupStanding[];
  updated_at: string;         // ISO timestamp of last successful scrape
  source_url: string;
  tournament_started: boolean;
}

const GroupStandingTeamSchema = z.object({
  team: z.string().min(1).max(100),
  played: z.number().int().nonnegative(),
  won: z.number().int().nonnegative(),
  drawn: z.number().int().nonnegative(),
  lost: z.number().int().nonnegative(),
  goals_for: z.number().int().nonnegative(),
  goals_against: z.number().int().nonnegative(),
  goal_difference: z.number().int(),
  points: z.number().int().nonnegative(),
  rank: z.number().int().positive().optional(),
});

const GroupStandingsResponseSchema = z.object({
  groups: z.array(z.object({
    group: z.string().min(1).max(50),
    teams: z.array(GroupStandingTeamSchema).max(8),
  })),
  updated_at: z.string(),
  source_url: z.string().url(),
  tournament_started: z.boolean(),
});

export const getGroupStandings = async (): Promise<GroupStandingsResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/groups/standings`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const parsed = GroupStandingsResponseSchema.safeParse(data);
    if (!parsed.success) {
      devError('Invalid /groups/standings payload', parsed.error.flatten());
      return null;
    }
    return parsed.data as GroupStandingsResponse;
  } catch (err) {
    devError('Failed to load group standings', err);
    return null;
  }
};

// =====================================================================
// Paystack Payments + Unlocks
// =====================================================================
//
// Backend contract (FastAPI):
//   POST /payments/paystack/init   body: { kind, item_key, amount_usd, callback_url }
//      -> { authorization_url: string, reference: string }
//   GET  /payments/paystack/verify?reference=...
//      -> { success: boolean, item_key: string }
//   GET  /unlocks                  -> { unlocks: string[] }  // list of item_keys
//   GET  /predictions/group/{group_name}
//      -> { matches: GroupMatchPrediction[], winner?: { team: string, probability: number } }

import type { UnlockKind } from './pricing';

export interface PaystackInitResponse {
  authorization_url: string;
  reference: string;
}

export const initPaystackPayment = async (
  kind: UnlockKind,
  itemKey: string,
  amountUsd: number,
): Promise<PaystackInitResponse> => {
  const callbackUrl = `${window.location.origin}${window.location.pathname}`;
  const response = await fetch(`${API_BASE_URL}/payments/paystack/init`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      kind,
      item_key: itemKey,
      amount_usd: amountUsd,
      callback_url: callbackUrl,
    }),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Unable to start payment. Please try again.');
  }
  return response.json();
};

export const verifyPaystackPayment = async (
  reference: string,
): Promise<{ success: boolean; item_key?: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/payments/paystack/verify?reference=${encodeURIComponent(reference)}`,
    { method: 'GET', headers: authHeaders() },
  );
  if (!response.ok) return { success: false };
  return response.json();
};

export const getUserUnlocks = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/unlocks`, {
      method: 'GET',
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.unlocks) ? data.unlocks : [];
  } catch {
    return [];
  }
};

export interface GroupMatchPrediction {
  id: number;
  home_team: string;
  away_team: string;
  date: string;
  time?: string;
  prediction?: {
    home_win: number;
    draw: number;
    away_win: number;
    predicted: string;
    confidence: string;
  };
}

export interface GroupPredictionsResponse {
  matches: GroupMatchPrediction[];
  winner?: { team: string; probability: number };
}

export const getGroupPredictions = async (
  groupName: string,
): Promise<GroupPredictionsResponse | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/predictions/group/${encodeURIComponent(groupName)}`,
      { method: 'GET', headers: authHeaders() },
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};
