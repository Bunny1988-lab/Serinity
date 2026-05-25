// src/lib/crypto.ts

/**
 * Utility functions for Client-Side End-to-End Encryption (E2EE) using the Web Crypto API.
 * Uses a Master Key architecture for PIN recovery.
 */

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Generates a random cryptographic salt (Base64 encoded).
 */
export function generateSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  return arrayBufferToBase64(salt)
}

/**
 * Generates a new random Master Key for AES-GCM.
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // Extractable so we can wrap it
    ['encrypt', 'decrypt']
  )
}

/**
 * Derives an AES-GCM Key Encryption Key (KEK) from a passphrase (PIN or Answer) and a Salt using PBKDF2.
 */
export async function deriveKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  const salt = base64ToArrayBuffer(saltBase64)

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts a Master Key using a derived Key Encryption Key (KEK).
 * Uses AES-GCM for wrapping, returning the wrapped key as Base64.
 */
export async function wrapMasterKey(masterKey: CryptoKey, kek: CryptoKey): Promise<{ wrappedKey: string; iv: string }> {
  // Export the raw Master Key
  const exported = await window.crypto.subtle.exportKey('raw', masterKey)
  
  // Encrypt it with the KEK just like normal text
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    kek,
    exported
  )

  return {
    wrappedKey: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv)
  }
}

/**
 * Decrypts a wrapped Master Key using a derived Key Encryption Key (KEK).
 */
export async function unwrapMasterKey(wrappedKeyBase64: string, ivBase64: string, kek: CryptoKey): Promise<CryptoKey> {
  const iv = base64ToArrayBuffer(ivBase64)
  const wrappedKey = base64ToArrayBuffer(wrappedKeyBase64)

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      kek,
      wrappedKey
    )

    // Re-import as a CryptoKey
    return window.crypto.subtle.importKey(
      'raw',
      decryptedBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    console.error("Master Key decryption failed.")
    throw new Error("Invalid passphrase")
  }
}

/**
 * Encrypts a plain text string.
 * Returns the Base64 encoded ciphertext and Initialization Vector (IV).
 */
export async function encryptText(text: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder()
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(text)
  )

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
  }
}

/**
 * Decrypts a Base64 encoded ciphertext using the provided IV and CryptoKey.
 */
export async function decryptText(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const iv = base64ToArrayBuffer(ivBase64)
  const ciphertext = base64ToArrayBuffer(ciphertextBase64)

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      ciphertext
    )
    const dec = new TextDecoder()
    return dec.decode(decryptedBuffer)
  } catch (error) {
    console.error("Data decryption failed.")
    throw new Error("Decryption failed")
  }
}
