const { spawn } = require('child_process');
const path = require('path');

const runCommand = (command, args, name, cwd) => {
  console.log(`\n🚀 Starting [${name}]...`);
  const child = spawn(command, args, { cwd, shell: true, stdio: 'pipe' });

  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name} ERROR] ${data}`));

  child.on('close', (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });

  return child;
};

async function start() {
  console.log('==========================================');
  console.log('   Starting Webinar HUB Full Stack');
  console.log('==========================================\n');

  // 1. Start Docker Services (Postgres + Redis)
  const dockerComposePath = path.join(__dirname, 'backend');
  const docker = runCommand('docker-compose', ['up', '-d'], 'Docker', dockerComposePath);

  // Wait 3 seconds for containers to initialize
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 2. Start Backend API 
  runCommand('npm', ['run', 'dev'], 'Backend API', path.join(__dirname, 'backend'));

  // 3. Start React Admin Panel
  runCommand('npm', ['run', 'dev'], 'Admin Panel', path.join(__dirname, 'admin-panel'));

  console.log('\n✅ All services orchestrated correctly! Streaming logs below...\n');
}

start();
