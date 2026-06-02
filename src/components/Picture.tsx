/**
 * Picture — serves AVIF → WebP → original PNG/JPG as a layered fallback.
 *
 * Pair with scripts/optimize-images.mjs, which writes `name.avif` + `name.webp`
 * siblings next to each `name.png`. In a <picture>, the browser downloads
 * exactly ONE source: AVIF for ~95%, WebP for the older-Safari sliver, and the
 * original PNG only for ancient browsers. So the PNG/WebP cost nothing on the
 * network for modern visitors — they're free fallbacks on disk. Originals are
 * never modified; git history is the backup.
 *
 * Pass a `.png`/`.jpg` `src` and it derives the siblings. Any other extension
 * (.gif/.svg/video frame) renders a plain <img> passthrough so nothing breaks.
 */
import { forwardRef } from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { src: string };

const OPTIMIZABLE = /\.(png|jpe?g)$/i;

const sibling = (src: string, ext: "avif" | "webp") =>
  src.replace(OPTIMIZABLE, `.${ext}`);

const Picture = forwardRef<HTMLImageElement, Props>(function Picture(
  { src, ...img },
  ref,
) {
  // Non-optimizable (gif/svg/video frame/etc.) → plain img, untouched.
  if (!OPTIMIZABLE.test(src)) {
    return <img ref={ref} src={src} {...img} />;
  }

  return (
    <picture>
      <source srcSet={sibling(src, "avif")} type="image/avif" />
      <source srcSet={sibling(src, "webp")} type="image/webp" />
      <img ref={ref} src={src} {...img} />
    </picture>
  );
});

export default Picture;

/**
 * bgImageSet — the CSS `background-image` equivalent of <Picture>, for the few
 * spots that use a background-image instead of an <img> (case-study cover,
 * work-list hover preview). Browsers pick AVIF → WebP → PNG via `type()`; the
 * PNG is last so any image-set-capable browser still gets a working image.
 * Returns a plain url() for non-optimizable sources.
 */
export function bgImageSet(src: string): string {
  if (!OPTIMIZABLE.test(src)) return `url("${src}")`;
  return (
    `image-set(` +
    `url("${sibling(src, "avif")}") type("image/avif"), ` +
    `url("${sibling(src, "webp")}") type("image/webp"), ` +
    `url("${src}") type("image/png"))`
  );
}
