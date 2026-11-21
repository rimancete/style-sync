import * as React from 'react';

import { cn } from '~/lib/utils';

const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
Panel.displayName = 'Panel';

const PanelHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
PanelHeader.displayName = 'PanelHeader';

type PanelTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3';
};

const PanelTitle = React.forwardRef<HTMLHeadingElement, PanelTitleProps>(
  ({ className, as: Heading = 'h3', ...props }, ref) => (
    <Heading
      ref={ref}
      className={cn('text-xl font-medium leading-none tracking-tighter', className)}
      {...props}
    />
  )
);
PanelTitle.displayName = 'PanelTitle';

const PanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
PanelDescription.displayName = 'PanelDescription';

const PanelContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
PanelContent.displayName = 'PanelContent';

export { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle };
