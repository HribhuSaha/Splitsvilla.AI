import {
  generateKeyPair,
  exportPublicKeyAsJwk,
  exportPrivateKeyAsJwk,
  importPrivateKeyFromJwk,
  importPublicKeyFromJwk,
} from "./crypto";

const DB_NAME = "cupid_e2ee";
const DB_VERSION = 1;
const STORE_NAME = "keys";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key: string): Promise<string | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOrCreateKeyPair(userId: string): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyJwk: string;
  isNew: boolean;
}> {
  const existingPrivateJwk = await dbGet(`private_${userId}`);
  const existingPublicJwk = await dbGet(`public_${userId}`);

  if (existingPrivateJwk && existingPublicJwk) {
    const [privateKey, publicKey] = await Promise.all([
      importPrivateKeyFromJwk(existingPrivateJwk),
      importPublicKeyFromJwk(existingPublicJwk),
    ]);
    return { privateKey, publicKey, publicKeyJwk: existingPublicJwk, isNew: false };
  }

  const keyPair = await generateKeyPair();
  const [privateJwk, publicJwk] = await Promise.all([
    exportPrivateKeyAsJwk(keyPair.privateKey),
    exportPublicKeyAsJwk(keyPair.publicKey),
  ]);

  await Promise.all([
    dbSet(`private_${userId}`, privateJwk),
    dbSet(`public_${userId}`, publicJwk),
  ]);

  return { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey, publicKeyJwk: publicJwk, isNew: true };
}

export async function getStoredPrivateKey(userId: string): Promise<CryptoKey | null> {
  const jwk = await dbGet(`private_${userId}`);
  if (!jwk) return null;
  return importPrivateKeyFromJwk(jwk);
}
