const core = require('@actions/core');
const io = require('@actions/io');

async function run() {
  try {
    // Cleanup Kaniko files
    const kanikoPath = core.getState('kaniko-path');
    if (kanikoPath) {
      await io.rmRF(kanikoPath);
    }
    
    // Cleanup system emulation
    const systemRoot = core.getState('system-root');
    if (systemRoot) {
      await io.rmRF(systemRoot);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
