import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Ingrese contraseña a hashear: ', (password) => {
  if (!password) {
    console.log('Contraseña vacía.');
    process.exit(1);
  }
  const hash = crypto.createHash('sha256').update(password.trim()).digest('hex');
  console.log('\n--- HASH SHA-256 ---');
  console.log(`AUTH_PASSWORD_HASH=${hash}`);
  rl.close();
});
