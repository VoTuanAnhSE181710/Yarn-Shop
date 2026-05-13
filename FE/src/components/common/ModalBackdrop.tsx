import { motion } from "motion/react";

interface ModalBackdropProps {
  onClick: () => void;
}

export function ModalBackdrop({ onClick }: ModalBackdropProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      onClick={onClick}
    />
  );
}
