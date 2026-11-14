import { IconProvider } from '../IconProvider';

type IconProps = {
  className?: string;
  onClick?: () => void;
};

export function Calendar({ className, onClick }: IconProps) {
  return (
    <IconProvider className={className} onClick={onClick}>
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </IconProvider>
  );
}
