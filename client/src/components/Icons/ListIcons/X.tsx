import { IconProvider } from '../IconProvider';

interface IconProps {
  className?: string;
  onClick?: () => void;
}

export function X({ className, onClick }: IconProps) {
  return (
    <IconProvider className={className} onClick={onClick}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </IconProvider>
  );
}
