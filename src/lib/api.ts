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

  return response.json();
};

// Fixtures API
export const getFixtures = async (): Promise<Fixture[]> => {
  const response = await fetch(`${API_BASE_URL}/fixtures`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch fixtures: ${response.statusText}`);
  }

  return response.json();
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
