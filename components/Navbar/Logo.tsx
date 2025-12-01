import { motion } from "motion/react";

const Logo = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="flex gap-2 items-center"
  >
    <img
      src="/images/logo/logo-icon.jpeg"
      alt="logo"
      className="h-8 rounded-md"
    />
    <img src="/images/logo/logo-name.jpeg" alt="logo-text" className="h-6" />
  </motion.div>
);

export default Logo;
