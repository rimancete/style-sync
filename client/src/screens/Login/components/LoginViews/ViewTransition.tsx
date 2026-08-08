import { motion } from 'framer-motion';

const transition = { duration: 0.25, ease: 'easeOut' as const };

type ViewTransitionProps = {
  children: React.ReactNode;
  keyName: string;
  className?: string;
};

// When multiple views are introduced, wrap this component in <AnimatePresence mode="wait">
// at the call site and use `keyName` as the direct child's key so exit animations fire.
export function ViewTransition({ children, keyName, className }: ViewTransitionProps) {
  return (
    <motion.div
      key={keyName}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
