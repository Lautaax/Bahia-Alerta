
/**
 * Servicio de Seguridad para Bahía Alerta
 * Utiliza Web Crypto API para operaciones criptográficas de alto rendimiento.
 */

// Genera un hash SHA-256 de una cadena (útil para contraseñas)
export const hashString = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Genera una clave a partir de un secreto para cifrado AES
const getEncryptionKey = async (secret: string) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('bahia-alerta-salt-2025'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Cifra un objeto o cadena con una clave secreta
export const encryptData = async (data: any, secret: string = 'local-device-key'): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getEncryptionKey(secret);
    const encodedData = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
    
    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error("Encryption error:", e);
    return "";
  }
};

// Descifra una cadena previamente cifrada
export const decryptData = async (encryptedBase64: string, secret: string = 'local-device-key'): Promise<any> => {
  try {
    const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const content = combined.slice(12);
    const key = await getEncryptionKey(secret);
    
    const decryptedContent = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      content
    );

    const decoder = new TextDecoder();
    const decodedText = decoder.decode(decryptedContent);
    
    try {
      return JSON.parse(decodedText);
    } catch {
      return decodedText;
    }
  } catch (e) {
    console.error("Decryption error:", e);
    return null;
  }
};
