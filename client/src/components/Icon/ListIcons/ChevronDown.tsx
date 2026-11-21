import { IconProvider } from '../IconProvider';

type IconProps = {
  className?: string;
  onClick?: () => void;
};

export function ChevronDown({ className, onClick }: IconProps) {
  return (
    <IconProvider className={className} onClick={onClick}>
      <path d="m6 9 6 6 6-6" />
    </IconProvider>
  );
}
