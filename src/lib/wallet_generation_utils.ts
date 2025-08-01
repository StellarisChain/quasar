/*
    /// TODOLIST ///
    - [ ] Replace elliptic with @noble/curves ✓
    - [ ] Replace bip39 with @scure/bip39 ✓
    - [ ] Rewrite this to be more simple (Less type conversions) ✓
    /// connor33341 <connor@connor33341.dev> ///
*/

import { Wallet } from '../pages/Popup/DataTypes';
// wallet_generation_utils.ts
// Browser-compatible wallet generation utilities

import * as bip39 from 'bip39';
import bs58 from 'bs58';
// import { p256 } from '@noble/curves/nist'; // removed p256 usage
import { secp256k1 } from '@noble/curves/secp256k1';
import { HDKey } from "@scure/bip32"

export type Endian = 'le' | 'be';
// noble-curves secp256k1 instance
export const ec = secp256k1;
export const ENDIAN: Endian = 'le'; // little-endian
export const SMALLEST = 1000000;

export enum AddressFormat {
    FULL_HEX = 'hex',
    COMPRESSED = 'compressed',
}

export function getJson(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

export function timestamp(): number {
    return Math.floor(Date.now() / 1000);
}

export async function sha256(message: string | Uint8Array): Promise<string> {
    let msgBytes: Uint8Array;
    if (typeof message === 'string') {
        // If hex string, convert to bytes
        msgBytes = /^[0-9a-fA-F]+$/.test(message) ?
            hexToBytes(message) :
            new TextEncoder().encode(message);
    } else {
        msgBytes = message;
    }
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBytes);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function byteLength(i: number): number {
    return Math.ceil((i.toString(2).length) / 8);
}

export function normalizeBlock(block: any): any {
    const b = { ...block };
    b.address = b.address.trim();
    b.timestamp = typeof b.timestamp === 'string' ? Date.parse(b.timestamp) / 1000 : b.timestamp;
    return b;
}

// ECDSA point conversion utilities using noble-curves
export function xToY(x: bigint, isOdd = false): bigint {
    // noble-curves: get point from x and y parity
    const point = ec.ProjectivePoint.fromHex(ec.ProjectivePoint.fromPrivateKey(x).toRawBytes(true));
    return point.y;
}

export function xToYFromX(x: bigint, isOdd: boolean = false): bigint {
    // noble-curves: get point from x and y parity
    const point = ec.ProjectivePoint.fromHex(ec.ProjectivePoint.fromPrivateKey(x).toRawBytes(true));
    return point.y;
}

export function bytesToPoint(pointBytes: Uint8Array): any {
    // noble-curves: accepts compressed/uncompressed
    try {
        return ec.ProjectivePoint.fromHex(pointBytes);
    } catch (e) {
        console.error('[bytesToPoint] Invalid point bytes', { pointBytes: Array.from(pointBytes), error: e });
        throw new Error('Invalid EC point bytes: ' + (e instanceof Error ? e.message : e));
    }
}

export function bytesToString(pointBytes: Uint8Array): string {
    const point = bytesToPoint(pointBytes);
    if (pointBytes.length === 64) {
        return pointToString(point, AddressFormat.FULL_HEX);
    } else if (pointBytes.length === 33) {
        return pointToString(point, AddressFormat.COMPRESSED);
    } else {
        throw new Error('Unsupported byte length');
    }
}

// Point to string (compressed/uncompressed) using noble-curves
export function pointToString(point: any, addressFormat: AddressFormat = AddressFormat.COMPRESSED): string {
    if (addressFormat === AddressFormat.FULL_HEX) {
        return bytesToHex(pointToBytes(point, AddressFormat.FULL_HEX));
    } else if (addressFormat === AddressFormat.COMPRESSED) {
        return bs58.encode(pointToBytes(point, AddressFormat.COMPRESSED));
    } else {
        throw new Error('Unsupported format');
    }
}
export function pointToBytes(point: any, addressFormat: AddressFormat = AddressFormat.FULL_HEX): Uint8Array {
    if (addressFormat === AddressFormat.FULL_HEX) {
        // Uncompressed (65 bytes, 0x04 prefix)
        return point.toRawBytes(false).slice(1); // remove 0x04 prefix
    } else if (addressFormat === AddressFormat.COMPRESSED) {
        // Compressed (33 bytes)
        return point.toRawBytes(true);
    } else {
        throw new Error('Unsupported format');
    }
}



// This bitch dosent work
/*export function pointToString(point: any, addressFormat: AddressFormat = AddressFormat.COMPRESSED): string {
    const x = point.getX();
    const y = point.getY();
    if (addressFormat === AddressFormat.FULL_HEX) {
        return bytesToHex(pointToBytes(point));
    } else if (addressFormat === AddressFormat.COMPRESSED) {
        // Compressed: Base58, first byte 42/43 for even/odd y
        const prefix = y % 2 === 0 ? 42 : 43;
        const bytes = new Uint8Array([prefix, ...Array.from(intToBytes(x, 32))]);
        return bs58.encode(bytes);
    } else {
        throw new Error('Unsupported format');
    }
}*/

export function stringToBytes(str: string): Uint8Array {
    // Try hex decode, fallback to base58
    try {
        return hexToBytes(str);
    } catch {
        return bs58.decode(str);
    }
}

export function stringToPoint(str: string): Uint8Array {
    let bytes: Uint8Array;
    try {
        bytes = stringToBytes(str);
    } catch (e) {
        console.error('[stringToPoint] Failed to decode string to bytes', { str, error: e });
        throw new Error('Failed to decode string to bytes for EC point: ' + (e instanceof Error ? e.message : e));
    }
    try {
        return bytesToPoint(bytes);
    } catch (e) {
        console.error('[stringToPoint] Failed to parse EC point from string', { str, bytes: Array.from(bytes), error: e });
        throw new Error('Failed to parse EC point from string: ' + (e instanceof Error ? e.message : e));
    }
}

export function hexToPoint(xHex: string, yHex: string): any {
    // noble-curves: create point from x/y
    const x = BigInt('0x' + xHex);
    const y = BigInt('0x' + yHex);
    return new ec.ProjectivePoint(x, y, BigInt(1));
}

export function privateToPublicKey(privateKeyHex: string): { point: any, compressed: string } {
    // Convert hex to bigint
    const privateKeyInt = BigInt('0x' + privateKeyHex);
    // Derive public key point
    const point = ec.ProjectivePoint.fromPrivateKey(privateKeyInt);
    // Get x and y coordinates
    const x = point.x;
    const y = point.y;
    // Determine prefix for compressed key
    const prefix = (y % BigInt(2) === BigInt(0)) ? '02' : '03';
    // Format x as 64 hex digits
    const xHex = x.toString(16).padStart(64, '0');
    // Compressed public key
    const compressed = prefix + xHex;
    return { point, compressed };
}

export function isValidMnemonic(mnemonicPhrase: string): boolean {
    const words = mnemonicPhrase.trim().split(/\s+/);
    return bip39.validateMnemonic(mnemonicPhrase) && words.length === 12;
}

export function generateMnemonic(): string {
    const mnemonic = bip39.generateMnemonic(128);
    if (typeof mnemonic === 'string') {
        return mnemonic;
    }
    // If it's a Uint8Array or ArrayBuffer, decode as UTF-8
    if (mnemonic && typeof mnemonic === 'object' && ArrayBuffer.isView(mnemonic)) {
        return new TextDecoder().decode(mnemonic);
    }
    // Fallback: force to string
    return '';
}

export function generate({
    mnemonicPhrase,
    passphrase = '',
    index = 0,
    deterministic = false,
    fields,
    walletVersion
}: {
    mnemonicPhrase?: string,
    passphrase?: string,
    index?: number,
    deterministic?: boolean,
    fields?: string[],
    walletVersion?: string
}): Wallet {
    let localMnemonic = mnemonicPhrase;
    let localPassphrase = passphrase ?? '';

    // Handle wallet version 0.2.3 compatibility
    if (walletVersion === '0.2.3') {
        localPassphrase = '';
    }

    // Generate mnemonic if not provided
    if (!localMnemonic) {
        localMnemonic = generateMnemonic();
    }

    // Validate mnemonic
    if (!isValidMnemonic(localMnemonic)) {
        throw new Error('Invalid mnemonic phrase');
    }

    if (!localPassphrase) localPassphrase = '';

    const seed = bip39.mnemonicToSeedSync(localMnemonic, localPassphrase);
    const root = HDKey.fromMasterSeed(seed);

    let privateKeyHex: string;
    let publicKeyHex: string;
    let publicKeyPoint: any;
    let address: string;
    const result: Wallet = {} as Wallet;

    if (deterministic) {
        // Derive child key at m/0/index path for deterministic generation
        const child = root.derive(`m/0/${index}`);
        if (!child.privateKey) throw new Error('Failed to derive child private key');

        privateKeyHex = bytesToHex(child.privateKey);
        const { point, compressed } = privateToPublicKey(privateKeyHex);
        publicKeyPoint = point;
        publicKeyHex = compressed;
        address = pointToString(publicKeyPoint, AddressFormat.COMPRESSED);

        // Set default fields for deterministic generation
        if (!fields) fields = ['mnemonic', 'id', 'private_key', 'public_key', 'address'];

        if (fields.includes('mnemonic')) result.mnemonic = localMnemonic;
        if (fields.includes('id')) result.id = index;
        if (fields.includes('private_key')) result.private_key = privateKeyHex;
        if (fields.includes('public_key')) result.public_key = publicKeyHex;
        if (fields.includes('address')) result.address = address;
    } else {
        // Use root key directly for non-deterministic generation
        if (!root.privateKey) throw new Error('Failed to get root private key');

        privateKeyHex = bytesToHex(root.privateKey);
        const { point, compressed } = privateToPublicKey(privateKeyHex);
        publicKeyPoint = point;
        publicKeyHex = compressed;
        address = pointToString(publicKeyPoint, AddressFormat.COMPRESSED);

        // Set default fields for non-deterministic generation
        if (!fields) fields = ['mnemonic', 'private_key', 'public_key', 'address'];

        if (fields.includes('mnemonic')) result.mnemonic = localMnemonic;
        if (fields.includes('private_key')) result.private_key = privateKeyHex;
        if (fields.includes('public_key')) result.public_key = publicKeyHex;
        if (fields.includes('address')) result.address = address;
    }

    return result;
}

export function generateFromPrivateKey(privateKeyHex: string, fields?: string[]): any {
    const { point, compressed } = privateToPublicKey(privateKeyHex);
    const address = pointToString(point);
    if (!fields) fields = ['private_key', 'public_key', 'address'];
    const result: any = {};
    if (fields.includes('private_key')) result.private_key = privateKeyHex;
    if (fields.includes('public_key')) result.public_key = compressed;
    if (fields.includes('address')) result.address = address;
    return result;
}

export function intToBytes(num: number | bigint, length: number): Uint8Array {
    let n = typeof num === 'bigint' ? num : BigInt(num);
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        const shift = BigInt(8 * (ENDIAN === 'le' ? i : length - i - 1));
        arr[i] = Number((n >> shift) & BigInt(255));
    }
    return arr;
}

export function bytesToInt(bytes: Uint8Array): bigint {
    let val = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
        const shift = BigInt(8 * (ENDIAN === 'le' ? i : bytes.length - i - 1));
        val += BigInt(bytes[i]) << shift;
    }
    return val;
}

/*
// Helper functions
export function intToBytes(num: number, length: number): Uint8Array {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = (num >> (8 * (ENDIAN === 'le' ? i : length - i - 1))) & 0xff;
    }
    return arr;
}

function bytesToInt(bytes: Uint8Array): number {
    let val = 0;
    for (let i = 0; i < bytes.length; i++) {
        val += bytes[i] * (1 << (8)); // * (ENDIAN === 'le' ? i : bytes.length - i - 1)
    }
    return val;
}*/

// Browser-safe hex encoding/decoding
export function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}
