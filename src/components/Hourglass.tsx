import { useId } from 'react';

/**
 * Animated hourglass icon for "Coming soon" affordances.
 *
 * Physically-honest sand, built so gravity reads correctly in BOTH the upright
 * and the flipped half of the loop, and so the glass tips as a rigid body.
 *
 * GEOMETRY
 *   Two straight-walled triangles meet at the neck (8,8): the top bulb's apex
 *   points down, the bottom bulb's up. These triangles ARE the sand masks, so
 *   sand always hugs the glass walls (no hand-drawn "blob", no gaps/clipping).
 *   Each bulb's fill is a horizontal "surface" cut: sand = triangle ∩ {y ≥ S}.
 *
 * THE LAYERING THAT MAKES IT WORK (verified against a geometry model):
 *   For each bulb the surface clip sits OUTSIDE the rotation and the triangle
 *   clip INSIDE it:
 *       <g clip=surface>            ← screen-fixed: the cut is always horizontal
 *         <g class=rotor>           ← the 360°/loop tip (two 180° flips)
 *           <g clip=triangle>       ← rotates, so it picks the right bulb
 *             <rect sand/>
 *   Because the surface is screen-fixed, "below the surface" means the same
 *   thing whether the glass is upright or inverted — so the upper bulb always
 *   drains DOWN to the neck and the lower bulb always fills UP from the floor,
 *   with no second-cycle inversion. The triangle still rotates, carrying each
 *   bulb's sand to its new position on a flip.
 *
 * RIGID FLIPS (no draining or morphing mid-spin — the old bug):
 *   Rotation only happens while one bulb is 100% full and the other 100% empty.
 *   During each flip the full bulb's surface opens just past the glass and the
 *   empty bulb's closes just past it, so the rotating full triangle is never
 *   sliced and the empty one never leaks — the settled sand turns as one solid
 *   mass. Those surface "openings" sit on full/empty, so they're invisible.
 *
 * The frame rotates on the same `rotor` clock (it's symmetric, so its 180°/360°
 * poses coincide). A thin neck stream is shown only while sand is falling.
 *
 * Colour follows `currentColor`, inheriting the surrounding text colour.
 */
export default function Hourglass({ className = '' }: { className?: string }) {
  // Unique ids so multiple icons on a page don't share clip definitions.
  const uid = useId().replace(/:/g, '');
  const triTop = `hg-tri-top-${uid}`;
  const triBot = `hg-tri-bot-${uid}`;
  const surfTop = `hg-surf-top-${uid}`;
  const surfBot = `hg-surf-bot-${uid}`;

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
        {/* Bulb interiors — clean triangles meeting at the neck (8,8). Inside
            the rotor, so they rotate and select which bulb holds the sand. */}
        <clipPath id={triTop}>
          <path d="M4.35 2.3 H11.65 L8 8 Z" />
        </clipPath>
        <clipPath id={triBot}>
          <path d="M8 8 L11.65 13.7 H4.35 Z" />
        </clipPath>

        {/* Sand surfaces — screen-fixed (outside the rotor). The rect's TOP edge
            is the sand line, so sand = triangle ∩ {y ≥ topEdge} and translateY
            (in px) IS that surface's y. Height 28 keeps the far edge well below
            the icon for every fill level. */}
        <clipPath id={surfTop}>
          <rect className="hourglass__surface-top" x="0" y="0" width="16" height="28" />
        </clipPath>
        <clipPath id={surfBot}>
          <rect className="hourglass__surface-bot" x="0" y="0" width="16" height="28" />
        </clipPath>
      </defs>

      {/* Top-bulb sand: screen-fixed surface → rotor → triangle → fill. */}
      <g clipPath={`url(#${surfTop})`}>
        <g className="hourglass__rotor">
          <g clipPath={`url(#${triTop})`}>
            <rect x="3" y="1" width="10" height="8" fill="currentColor" />
          </g>
        </g>
      </g>

      {/* Bottom-bulb sand, same layering. */}
      <g clipPath={`url(#${surfBot})`}>
        <g className="hourglass__rotor">
          <g clipPath={`url(#${triBot})`}>
            <rect x="3" y="7" width="10" height="8" fill="currentColor" />
          </g>
        </g>
      </g>

      {/* Frame + falling stream rotate on the same clock, unclipped by surfaces. */}
      <g className="hourglass__rotor">
        <rect
          className="hourglass__stream"
          x="7.6"
          y="6"
          width="0.8"
          height="5"
          fill="currentColor"
        />
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
