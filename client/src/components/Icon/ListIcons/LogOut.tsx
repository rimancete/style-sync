import { IconProvider } from '../IconProvider';

type IconProps = {
  className?: string;
  onClick?: () => void;
};

export function LogOut({ className, onClick }: IconProps) {
  return (
    <IconProvider className={className} onClick={onClick}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </IconProvider>
  );
}
