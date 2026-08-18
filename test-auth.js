import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

async function test() {
  try {
    const r = await Math.random().toString(36).substring(7);
    const email = `test-${r}@example.com`;
    console.log('Testing create user...', email);
    const userCred = await createUserWithEmailAndPassword(auth, email, 'Password123!');
    console.log('Created:', userCred.user.uid);
  } catch(e) {
    console.error('Error creating user:', e.code, e.message);
  }
}
test();
