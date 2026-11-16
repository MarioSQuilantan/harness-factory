let verbose = false;

export function configureInstallLog(options = {}) {
  const env = process.env.HF_VERBOSE;
  verbose = Boolean(options.verbose) || env === '1' || env === 'true';
}

export function isInstallVerbose() {
  return verbose;
}

/** User-visible install progress (always shown during apply). */
export function installProgress(message) {
  console.log(`▸ harness-factory ${message}`);
}

export function installProgressDetail(message) {
  if (!verbose) return;
  console.log(`  … ${message}`);
}

/**
 * Failure output: message always; stack and cause when verbose (or HF_VERBOSE=1).
 */
export function reportInstallFailure(phase, error) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`\n✖ harness-factory failed: ${phase}`);
  console.error(`  ${err.message}`);
  if (err.cause instanceof Error) {
    console.error(`  cause: ${err.cause.message}`);
    if (verbose && err.cause.stack) console.error(err.cause.stack);
  }
  if (verbose && err.stack) console.error(err.stack);
  else console.error('  (más detalle: añade --verbose o HF_VERBOSE=1)');
}