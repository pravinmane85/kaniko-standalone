/**
 Maintainer : Pravin Mane <pravinmane0985@gmail.com>

*/
const core = require('@actions/core');
const exec = require('@actions/exec');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');
const path = require('path');
const os = require('os');
const fs = require('fs');

async function setupSystemEmulation(workspace) {
  const systemRoot = path.join(workspace, 'kaniko-system');
  await io.mkdirP(systemRoot);

  // Create minimal /proc emulation
  const procDir = path.join(systemRoot, 'proc');
  await io.mkdirP(procDir);
  await io.mkdirP(path.join(procDir, 'self'));
  
  // Create basic proc files Kaniko needs
  fs.writeFileSync(path.join(procDir, 'self', 'stat'), '0 0 0 0 0 0 0 0 0 0');
  fs.writeFileSync(path.join(procDir, 'self', 'mountinfo'), 'none / / 0 0');
  
  // Create /sys emulation
  const sysDir = path.join(systemRoot, 'sys');
  await io.mkdirP(sysDir);
  
  // Create /dev emulation
  const devDir = path.join(systemRoot, 'dev');
  await io.mkdirP(devDir);
  fs.writeFileSync(path.join(devDir, 'null'), '');
  
  // Create /etc/passwd with minimal entries
  const etcDir = path.join(systemRoot, 'etc');
  await io.mkdirP(etcDir);
  fs.writeFileSync(path.join(etcDir, 'passwd'), 'root:x:0:0:root:/root:/bin/sh\n');
  
  return systemRoot;
}

async function run() {
  try {
    const version = core.getInput('version');
    const shouldEmulate = core.getInput('emulate-system') === 'true';
    const platform = os.platform() === 'win32' ? 'windows' : os.platform();
    const arch = os.arch() === 'x64' ? 'amd64' : os.arch();
    
    // Download and extract Kaniko
    const kanikoUrl = `https://github.com/GoogleContainerTools/kaniko/releases/download/${version}/kaniko-${version}-${platform}-${arch}.tar.gz`;
    core.info(`Downloading Kaniko from ${kanikoUrl}`);
    
    const downloadPath = await tc.downloadTool(kanikoUrl);
    const extractPath = await tc.extractTar(downloadPath);
    
    // Make executor executable
    const executorPath = path.join(extractPath, 'executor');
    if (platform !== 'windows') {
      await exec.exec('chmod', ['+x', executorPath]);
    }
    
    // Set up system emulation if requested
    let systemRoot = '';
    if (shouldEmulate) {
      systemRoot = await setupSystemEmulation(extractPath);
      core.exportVariable('KANIKO_SYSTEM_ROOT', systemRoot);
    }
    
    // Add to PATH
    core.addPath(extractPath);
    core.info(`Added Kaniko to PATH: ${extractPath}`);
    
    // Set outputs
    core.setOutput('kaniko-path', extractPath);
    core.setOutput('executor-path', executorPath);
    core.saveState('system-root', systemRoot);
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
