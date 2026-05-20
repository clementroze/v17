import { useId } from 'react';

/**
 * Animated hourglass icon for "Coming soon" buttons.
 *
 * Physically-honest, fully looping sand:
 *
 * - The two bulbs meet at the neck (8,8), which is also the rotation centre.
 * - Each bulb holds a fixed sand pile shape. How much is visible is controlled
 *   by a "surface" rectangle inside a clipPath, moved purely with CSS transforms
 *   (which animate smoothly and never snap).
 * - Sand obeys gravity: the UPPER pile's surface falls toward the neck as it
 *   empties; the LOWER pile rises from the FLOOR as it fills.
 * - The clips live INSIDE the rotating group, so a 180° flip automatically
 *   inverts each bulb's fall direction — the same sand that just drained now
 *   sits in what is geometrically the other triangle, already in place. Nothing
 *   is ever moved "back": one full loop is two drains + two flips (a 360° turn),
 *   and every animated value ends the loop exactly where it began.
 *
 * Colour follows `currentColor`, so it inherits the button text colour and the
 * outline-white-full hover invert works automatically.
 */
export default function Hourglass({ className = '' }: { className?: string }) {
  // Unique clip ids so multiple icons on a page don't collide.
  const uid = useId().replace(/:/g, '');
  const clipTop = `hg-top-${uid}`;
  const clipBot = `hg-bot-${uid}`;

  return (
    <svg
      className={`hourglass ${className}`.trim()}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {/*
          Each clip is a tall rectangle that, at rest, fully covers its bulb.
          The animation slides it along the local Y axis so its edge acts as the
          sand surface:
            • top bulb  — the rect slides DOWN (covering from the neck up), so the
              exposed sand shrinks toward the neck → surface falls. (drain)
            • bottom bulb — the rect slides UP from the floor, exposing sand from
              the bottom → pile rises. (fill)
          Because they sit inside the rotating group, the directions invert on
          each flip, which is what keeps gravity correct in both orientations.
        */}
        <clipPath id={clipTop}>
          <rect className="hourglass__surface-top" x="3" y="1" width="10" height="7.2" />
        </clipPath>
        <clipPath id={clipBot}>
          <rect className="hourglass__surface-bot" x="3" y="7.8" width="10" height="7.2" />
        </clipPath>
      </defs>

      {/* Everything rotates together about the neck (8,8) = 50% 50%. */}
      <g className="hourglass__rotor">
        {/* Top pile — apex at the neck, dished top surface, edges hugging the
            curved walls. Clipped by the draining surface. */}
        <g clipPath={`url(#${clipTop})`}>
          <path
            d="M4.7 2.35
               Q8 3.15 11.3 2.35
               C11.2 4.05 9 5.6 8 8
               C7 5.6 4.8 4.05 4.7 2.35Z"
            fill="currentColor"
          />
        </g>

        {/* Bottom pile — apex at the neck, rounded mound on the bottom bar.
            Clipped by the filling surface. */}
        <g clipPath={`url(#${clipBot})`}>
          <path
            d="M8 8
               C9 10.4 11.2 11.95 11.3 13.65
               Q8 12.85 4.7 13.65
               C4.8 11.95 7 10.4 8 8Z"
            fill="currentColor"
          />
        </g>

        {/* Frame: top & bottom bars + the two glass walls meeting at the neck. */}
        <path
          d="M3 1.5h10M3 14.5h10M4 1.5c0 3 4 4.5 4 6.5s-4 3.5-4 6.5M12 1.5c0 3-4 4.5-4 6.5s4 3.5 4 6.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
