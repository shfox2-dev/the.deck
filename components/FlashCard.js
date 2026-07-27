// Shared card visual: off-white surface, blue text, a green-dark shadow
// instead of a border, sized to match the landing page. Any page that
// displays a card should use this instead of hand-rolling the styling.
//
// Sizing: landing page cards are w-60 h-96 (240px x 384px), a 5:8 ratio.
// Pass a `size` to scale down proportionally without breaking that ratio.
const SIZES = {
  lg: { width: 240, height: 384 }, // matches landing page exactly
  md: { width: 180, height: 288 },
  sm: { width: 128, height: 205 },
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
          ? "8px 8px 4px 0 var(--color-gold-dark)"
          : "8px 8px 4px 0 var(--color-green-dark)",
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
