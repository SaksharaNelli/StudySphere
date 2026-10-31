const { execSync } = require('child_process');
const fs = require('fs');
if (!fs.existsSync('.env')) { fs.copyFileSync('.env.example', '.env'); console.log('Created .env from .env.example. Set DB_PASSWORD if your MySQL root user has one.'); }
const dirs = ['.', 'frontend', ...fs.readdirSync('services').map((s) => 'services/' + s)];
for (const d of dirs) { console.log(`\n> npm install in ${d}`); execSync('npm install', { cwd: d, stdio: 'inherit' }); }
console.log('\nAll dependencies installed. Start everything with: npm run dev');
