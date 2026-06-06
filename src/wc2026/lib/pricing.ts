// Tournament unlock pricing (USD). Keep in sync with backend.
export type UnlockKind =
  | 'group_match'      // per match prediction within a group: $1
  | 'group_winner'     // group winner prediction: $2
  | 'round_of_32'      // next round per match: $3
  | 'quarter_final'    // per match: $4
  | 'semi_final'       // per match: $5
  | 'third_place'      // 3rd & 4th playoff: $5
  | 'final';           // final: $6

export const UNLOCK_PRICES_USD: Record<UnlockKind, number> = {
  group_match: 1,
  group_winner: 2,
  round_of_32: 3,
  quarter_final: 4,
  semi_final: 5,
  third_place: 5,
  final: 6,
};

export const UNLOCK_LABELS: Record<UnlockKind, string> = {
  group_match: 'Match prediction',
  group_winner: 'Group winner',
  round_of_32: 'Round of 32 prediction',
  quarter_final: 'Quarter-final prediction',
  semi_final: 'Semi-final prediction',
  third_place: '3rd/4th playoff prediction',
  final: 'Final prediction',
};

// What data is hidden and what unlocking reveals for each kind.
export const UNLOCK_DESCRIPTIONS: Record<UnlockKind, { hidden: string; reveals: string }> = {
  group_match: {
    hidden: 'Home win • Draw • Away win probabilities and predicted result are concealed.',
    reveals: 'Unlock AI-generated match probabilities and the most likely outcome.',
  },
  group_winner: {
    hidden: 'The AI-predicted group winner and confidence percentage are concealed.',
    reveals: 'Reveal which team the model picks to top the group and its win probability.',
  },
  round_of_32: {
    hidden: 'Knockout match probabilities and predicted winner are concealed.',
    reveals: 'Unlock AI probabilities for this Round of 32 fixture.',
  },
  quarter_final: {
    hidden: 'Quarter-final probabilities and predicted winner are concealed.',
    reveals: 'Unlock AI probabilities for this quarter-final match.',
  },
  semi_final: {
    hidden: 'Semi-final probabilities and predicted winner are concealed.',
    reveals: 'Unlock AI probabilities for this semi-final match.',
  },
  third_place: {
    hidden: '3rd-place playoff probabilities and predicted winner are concealed.',
    reveals: 'Unlock AI probabilities for the 3rd/4th place playoff.',
  },
  final: {
    hidden: 'Final match probabilities and predicted World Cup winner are concealed.',
    reveals: 'Unlock AI probabilities for the FIFA World Cup 2026 final.',
  },
};


// Stable item key used as the Paystack metadata identifier and unlocks key.
export const buildItemKey = (kind: UnlockKind, ref: string) => `${kind}:${ref}`;
