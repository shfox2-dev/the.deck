// Shared card visual: off-white surface, blue text, a green-dark shadow
// instead of a border, sized to match the landing page. Any page that
// displays a card should use this instead of hand-rolling the styling.
//
// Sizing: a real deck of cards is 5:7 (width:height). Landing page cards are
// w-60 h-84 (240px x 336px) to match that ratio -- keep width:height at 5:7
// if you resize any of these.
const SIZES = {
  lg: { width: 240, height: 336 }, // matches landing page exactly
  md: { width: 180, height: 252 },
  sm: { width: 128, height: 179 },
};

export default function FlashCard({
  children,
  size = "lg",
  gold = false,
  as: Component = "div",
  className = "",
  style = {},
  ...rest
}) {
  const { width, height } = SIZES[size] || SIZES.lg;

  return (
    <Component
      style={{
        width,
        height,
        boxShadow: gold
          ? "5px 0 2px 0 var(--color-gold-dark)"
          : "5px 0 2px 0 var(--color-green-dark)",
        ...style,
      }}
      className={`rounded-xl flex items-center justify-center text-center px-4 shrink-0
        ${gold ? "bg-gold-med text-gold-dark" : "bg-off-white text-blue"} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
