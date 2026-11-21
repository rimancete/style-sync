import { IconProvider } from '../IconProvider';

type IconProps = {
  className?: string;
  onClick?: () => void;
};

export function CreditCard({ className, onClick }: IconProps) {
  return (
    <IconProvider className={className} onClick={onClick}>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M2 10h20" />
    </IconProvider>
  );
}
