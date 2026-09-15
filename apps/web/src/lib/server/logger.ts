export function createLogger(name: string) {
  const prefix = `[${name}]`;
  return {
    log: (...args: unknown[]) => console.log(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    debug: (...args: unknown[]) => console.debug(prefix, ...args),
  };
}
