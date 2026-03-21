import React from 'react';
import * as Icons from './ListIcons';

type IconProps = {
  name: keyof typeof Icons;
  className?: string;
  onClick?: () => void;
};

export function Icon({ name, className, onClick }: IconProps) {
  const SelectedIcon = Icons[name];

  if (!SelectedIcon) return null;

  return React.cloneElement(<SelectedIcon />, { className, onClick });
}
