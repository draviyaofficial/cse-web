const CTAButton = ({ fullWidth = false }: { fullWidth?: boolean }) => (
  <button
    className={`${
      fullWidth ? "w-full" : "px-5"
    } bg-linear-to-t from-zinc-800 to-zinc-700 border border-zinc-700 hover:from-zinc-900 hover:to-zinc-800 font-semibold text-white py-2 rounded-full transition-all duration-300`}
  >
    Join the Hype
  </button>
);

export default CTAButton;
