import { IconProvider } from '../IconProvider';

type IconProps = {
  className?: string;
  onClick?: () => void;
};

export function Menu({ className, onClick }: IconProps) {
  return (
    <IconProvider className={className} onClick={onClick}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconProvider>
  );
}
