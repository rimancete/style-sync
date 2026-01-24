import { IconProvider } from '../IconProvider';

interface IconProps {
  className?: string;
  onClick?: () => void;
}

export function Check({ className, onClick }: IconProps) {
  return (
    <IconProvider className={className} onClick={onClick}>
      <polyline points="20 6 9 17 4 12" />
    </IconProvider>
  );
}
