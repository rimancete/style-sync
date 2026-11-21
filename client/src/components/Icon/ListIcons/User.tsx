import { IconProvider } from '../IconProvider';

type IconProps = {
  className?: string;
  onClick?: () => void;
};

export function User({ className, onClick }: IconProps) {
  return (
    <IconProvider className={className} onClick={onClick}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </IconProvider>
  );
}
