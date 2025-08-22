// Returns the cumulative XP required to reach the START of `level` (1-indexed).
// Level 1 starts at 0 XP. We model progression with a quadratic curve applied to (level-1):
// cumulative(level) = 150*(L-1)^2 + 100*(L-1)
// XP needed to go from level L to L+1 = cumulative(L+1) - cumulative(L) = 300*(L-1) + 250.
// This yields deltas: L1->2:250, L2->3:550, L3->4:850, ... increasing by 300 each level.
module.exports = (level) => {
  if (level <= 1) return 0;
  const l = level - 1;
  return 150 * (l ** 2) + 100 * l;
};