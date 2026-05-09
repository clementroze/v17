import arrowWhite from '../assets/arrow.svg';
import Button from './Button';

type ProjectSectionProps = {
  number: string;
  name: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  parallax?: boolean;
};

export default function ProjectSection({
  number,
  name,
  imageSrc,
  imageAlt = '',
  href = '#',
  parallax = false,
}: ProjectSectionProps) {
  return (
    <section className="project">
      <img
        src={imageSrc}
        alt={imageAlt}
        className={parallax ? 'project__bg--parallax' : 'project__bg'}
      />
      <div className="project__inner">
        <div className="project__text">
          <span className="project__number">{number}</span>
          <span className="project__name">{name}</span>
        </div>
        <Button
          variant="outline-white-full"
          href={href}
          iconSrc={arrowWhite}
          iconAlt="Arrow"
          fullWidth={false}
        >
          View
        </Button>
      </div>
    </section>
  );
}
