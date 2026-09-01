// This is a length-based heuristic, not a pixel-exact fit -- it shrinks
// text in steps based on character count, tuned for the small matching-game
// tiles. Works well for typical vocab/definition lengths; an extremely long
// single unbroken word could still be an edge case worth revisiting.
export function fitTextSizeClass(text) {
  const len = (text || "").length;
  if (len <= 15) return "text-lg";
  if (len <= 30) return "text-base";
  if (len <= 50) return "text-sm";
  if (len <= 80) return "text-xs";
  return "text-[10px]";
}
