import { forwardRef } from "react";
import { Link } from "../lib/router";
import Hourglass from "./Hourglass";

type ButtonVariant = "dark-gray" | "light-gray" | "accent" | "black";

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
  href?: string;
  iconSrc?: string;
  iconAlt?: string;
  /** Inline glyph rendered instead of an image icon. Spins on hover / while
   *  expanded — 'plus' for the About "More" trigger, 'minus' for "Close". */
  icon?: "plus" | "minus";
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  ariaHaspopup?: React.AriaAttributes["aria-haspopup"];
  ariaExpanded?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "dark-gray",
    fullWidth = false,
    className,
    href,
    iconSrc,
    iconAlt = "",
    icon,
    disabled = false,
    onClick,
    ariaLabel,
    ariaHaspopup,
    ariaExpanded,
  },
  ref,
) {
  const classes = ["btn", `btn--${variant}`, fullWidth ? "btn--full-width" : "", disabled ? "btn--disabled" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  let trailing: React.ReactNode = null;
  if (disabled) {
    trailing = <Hourglass className="btn__icon" />;
  } else if (icon) {
    // Horizontal bar always; the vertical bar (making it a plus) only for 'plus'.
    trailing = (
      <span className="btn__glyph" aria-hidden="true">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <line className="btn__glyph-bar" x1="5" y1="12" x2="19" y2="12" />
          {icon === "plus" && <line className="btn__glyph-bar" x1="12" y1="5" x2="12" y2="19" />}
        </svg>
      </span>
    );
  } else if (iconSrc) {
    trailing = <img className="btn__icon" src={iconSrc} alt={iconAlt} />;
  }

  const content = (
    <>
      <span className="label">{children}</span>
      {trailing}
    </>
  );

  if (href && !disabled) {
    const isInternal = href.startsWith("/");
    if (isInternal) {
      return (
        <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick ? () => onClick() : undefined}>
          {content}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick ? () => onClick() : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      aria-label={ariaLabel}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </button>
  );
});

export default Button;
