// Removed Development Check for Testing Mode
export const logger = {
    log: (...args: unknown[]) => {
        console.log(...args);
    },
    warn: (...args: unknown[]) => {
        console.warn(...args);
    },
    error: (...args: unknown[]) => {
        console.error(...args);
    }
};
