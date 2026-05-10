import { Link } from '../lib/router';

type ButtonVariant = 'white' | 'outline-white' | 'outline-white-full' | 'outline-black';

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  href?: string;
  iconSrc?: string;
  iconAlt?: string;
  disabled?: boolean;
};

export default function Button({
  children,
  variant = 'outline-white-full',
  fullWidth = false,
  href,
  iconSrc,
  iconAlt = '',
  disabled = false,
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
      {iconSrc && !disabled && <img className="btn__icon" src={iconSrc} alt={iconAlt} />}
    </>
  );

  if (href && !disabled) {
    const isInternal = href.startsWith('/');
    if (isInternal) {
      return <Link href={href} className={classes}>{content}</Link>;
    }
    return <a href={href} className={classes}>{content}</a>;
  }

  return <button className={classes} disabled={disabled}>{content}</button>;
}
