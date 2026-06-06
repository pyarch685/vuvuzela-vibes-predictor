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

// Stable item key used as the Paystack metadata identifier and unlocks key.
export const buildItemKey = (kind: UnlockKind, ref: string) => `${kind}:${ref}`;
