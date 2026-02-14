// Minimal process shim for the web test bundle.
// The browserify `util` and `assert` packages reference `process`
// (e.g., process.env.NODE_DEBUG). This file is injected by esbuild
// so that `process` is defined in the browser environment.
import process from 'process/browser';
export { process };
