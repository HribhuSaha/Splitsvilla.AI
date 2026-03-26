const RSA_ALGORITHM = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const AES_ALGORITHM = { name: "AES-GCM", length: 256 };

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  encryptedKeyForSender: string;
  encryptedKeyForRecipient: string;
}

function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(RSA_ALGORITHM, true, ["encrypt", "decrypt"]);
}

export async function exportPublicKeyAsJwk(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

export async function exportPrivateKeyAsJwk(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

export async function importPublicKeyFromJwk(jwkStr: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkStr);
  return crypto.subtle.importKey("jwk", jwk, RSA_ALGORITHM, true, ["encrypt"]);
}

export async function importPrivateKeyFromJwk(jwkStr: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkStr);
  return crypto.subtle.importKey("jwk", jwk, RSA_ALGORITHM, true, ["decrypt"]);
}

export async function encryptMessage(
  plaintext: string,
  senderPublicKey: CryptoKey,
  recipientPublicKey: CryptoKey
): Promise<EncryptedMessage> {
  const aesKey = await crypto.subtle.generateKey(AES_ALGORITHM, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(plaintext)
  );
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const [encKeyForSender, encKeyForRecipient] = await Promise.all([
    crypto.subtle.encrypt({ name: "RSA-OAEP" }, senderPublicKey, rawAesKey),
    crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientPublicKey, rawAesKey),
  ]);

  return {
    encryptedContent: bufferToBase64(encryptedContent),
    iv: bufferToBase64(iv.buffer),
    encryptedKeyForSender: bufferToBase64(encKeyForSender),
    encryptedKeyForRecipient: bufferToBase64(encKeyForRecipient),
  };
}

export async function decryptMessage(
  msg: EncryptedMessage,
  privateKey: CryptoKey,
  isSender: boolean
): Promise<string> {
  const encryptedAesKey = base64ToBuffer(
    isSender ? msg.encryptedKeyForSender : msg.encryptedKeyForRecipient
  );
  const rawAesKey = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedAesKey);
  const aesKey = await crypto.subtle.importKey("raw", rawAesKey, AES_ALGORITHM, false, ["decrypt"]);
  const iv = base64ToBuffer(msg.iv);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    base64ToBuffer(msg.encryptedContent)
  );
  return new TextDecoder().decode(decrypted);
}
