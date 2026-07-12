export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export const scaleHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
};
