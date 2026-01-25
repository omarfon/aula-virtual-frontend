const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const builder = path.join(__dirname, 'build-tailwind.js');

function runBuild() {
  const p = exec(`node "${builder}"`, (err, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  });
}

const watchFile = path.join(__dirname, '..', 'src', 'styles.css');
runBuild();
fs.watch(watchFile, { persistent: true }, (eventType) => {
  if (eventType === 'change') {
    console.log('styles.css changed — rebuilding tailwind...');
    runBuild();
  }
});
