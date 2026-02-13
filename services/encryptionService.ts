export class EncryptionService {
    // Generate a random AES-GCM key
    static async generateKey(): Promise<CryptoKey> {
        return window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    // Export key to string (JWK) for storage/sharing (Be careful with this!)
    static async exportKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        return JSON.stringify(exported);
    }

    // Import key from string
    static async importKey(keyStr: string): Promise<CryptoKey> {
        const jwk = JSON.parse(keyStr);
        return window.crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "AES-GCM" },
            true,
            ["encrypt", "decrypt"]
        );
    }

    // Encrypt file/blob
    static async encryptFile(file: Blob, key: CryptoKey): Promise<{ encryptedBlob: Blob, iv: Uint8Array }> {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const arrayBuffer = await file.arrayBuffer();

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            arrayBuffer
        );

        return {
            encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
            iv: iv
        };
    }

    // Decrypt file/blob - optionally provide originalMimeType for correct rendering
    static async decryptFile(encryptedBlob: Blob, key: CryptoKey, iv: Uint8Array, originalMimeType?: string): Promise<Blob> {
        const arrayBuffer = await encryptedBlob.arrayBuffer();

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv as any
            },
            key,
            arrayBuffer
        );

        // Return blob with original MIME type if provided, otherwise default to PDF
        return new Blob([decryptedBuffer], { type: originalMimeType || 'application/pdf' });
    }

    // Helper to convert IV to string (base64) for storage
    static ivToString(iv: Uint8Array): string {
        return btoa(String.fromCharCode(...iv));
    }

    // Helper to convert string (base64) to IV
    static stringToIv(ivStr: string): Uint8Array {
        const binary = atob(ivStr);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}
