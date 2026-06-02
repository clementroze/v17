import { Link } from '../lib/router';
import Hourglass from './Hourglass';

type ButtonVariant = 'white' | 'outline-gray' | 'outline-white-full' | 'outline-black';

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  href?: string;
  iconSrc?: string;
  iconAlt?: string;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

export default function Button({
  children,
  variant = 'outline-white-full',
  fullWidth = false,
  href,
  iconSrc,
  iconAlt = '',
  disabled = false,
  onClick,
  ariaLabel,
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    fullWidth ? 'btn--full-width' : '',
    disabled ? 'btn--disabled' : '',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <span>{children}</span>
      {disabled
        ? <Hourglass className="btn__icon" />
        : iconSrc && <img className="btn__icon" src={iconSrc} alt={iconAlt} />}
    </>
  );

  if (href && !disabled) {
    const isInternal = href.startsWith('/');
    if (isInternal) {
      return <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick ? () => onClick() : undefined}>{content}</Link>;
    }
    return <a href={href} className={classes} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer" onClick={onClick ? () => onClick() : undefined}>{content}</a>;
  }

  return <button className={classes} aria-label={ariaLabel} disabled={disabled} onClick={onClick}>{content}</button>;
}
