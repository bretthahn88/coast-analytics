import { motion } from 'framer-motion';

/**
 * Fade-in + slide-up wrapper using framer-motion. Pass `delay` for stagger.
 *   <Reveal>...</Reveal>
 *   <Reveal delay={0.1}>...</Reveal>
 */
export function Reveal({ children, delay = 0, y = 40, once = true, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger helper -- pass children that are <Reveal>'d themselves with delay */
export function RevealGroup({ children, stagger = 0.1, ...rest }) {
  return (
    <>
      {Array.isArray(children)
        ? children.map((c, i) => (
            <Reveal key={i} delay={i * stagger} {...rest}>{c}</Reveal>
          ))
        : children}
    </>
  );
}
