import { motion } from "motion/react";
import { Lock } from "lucide-react";

interface AuthPromptProps {
  onSignIn: () => void;
}

export function AuthPrompt({ onSignIn }: AuthPromptProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <h2 className="mb-4">Sign In Required</h2>
        <p className="text-muted-foreground mb-8">
          Please sign in to access the shop and start your cozy crochet journey!
        </p>
        <button
          onClick={onSignIn}
          className="bg-primary text-primary-foreground px-8 py-4 rounded-full hover:bg-primary/90 transition-colors"
        >
          Sign In to Continue
        </button>
      </motion.div>
    </div>
  );
}
