// wallet_generation_utils.ts
// Browser-compatible wallet generation utilities
// Requires: npm install elliptic bip39 bs58

import * as bip39 from 'bip39';
import bs58 from 'bs58';
import { ec as EC } from 'elliptic';
import { Wallet } from '../pages/Popup/DataTypes';

export type Endian = 'le' | 'be';
type ECType = InstanceType<typeof EC>;
export const ec: ECType = new EC('p256'); // Equivalent to P256 curve
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

// ECDSA point conversion utilities
export function xToY(x: number, isOdd = false): number {
    // y^2 = x^3 + ax + b mod p
    // Not implemented: mod_sqrt for browser JS. Use elliptic's point-from-x
    const point = ec.curve.pointFromX(x, isOdd);
    return point.y;
}

// Given the x-coordinate, compute the y-coordinate on the elliptic curve.
// Uses elliptic.js for browser compatibility.
export function xToYFromX(x: number, isOdd: boolean = false): number {
    // Use elliptic's pointFromX to get the point, then return y
    const point = ec.curve.pointFromX(x, isOdd);
    return point.y;
}

export function bytesToPoint(pointBytes: Uint8Array): any {
    if (pointBytes.length === 64) {
        const x = bytesToInt(pointBytes.slice(0, 32));
        const y = bytesToInt(pointBytes.slice(32, 64));
        try {
            return ec.curve.point(x, y);
        } catch (e) {
            throw new Error('Invalid uncompressed point: ' + (e instanceof Error ? e.message : e));
        }
    } else if (pointBytes.length === 33) {
        const specifier = pointBytes[0];
        const x = bytesToInt(pointBytes.slice(1)); // 
        try {
            // specifier 43 means odd y, 42 means even y
            return ec.curve.pointFromX(x, specifier === 43);
        } catch (e) {
            throw new Error('Invalid compressed point: ' + (e instanceof Error ? e.message : e));
        }
    } else {
        throw new Error('Unsupported byte length for EC point: ' + pointBytes.length);
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

export function pointToBytes(point: any, addressFormat: AddressFormat = AddressFormat.FULL_HEX): Uint8Array {
    if (addressFormat === AddressFormat.FULL_HEX) {
        return new Uint8Array([
            ...Array.from(intToBytes(point.getX(), 32)),
            ...Array.from(intToBytes(point.getY(), 32))
        ]);
    } else if (addressFormat === AddressFormat.COMPRESSED) {
        return stringToBytes(pointToString(point, AddressFormat.COMPRESSED));
    } else {
        throw new Error('Unsupported format');
    }
}

export function pointToString(point: any, addressFormat: AddressFormat = AddressFormat.COMPRESSED): string {
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
}

export function stringToBytes(str: string): Uint8Array {
    // Try hex decode, fallback to base58
    try {
        return hexToBytes(str);
    } catch {
        return bs58.decode(str);
    }
}

export function stringToPoint(str: string): any {
    let bytes: Uint8Array;
    try {
        bytes = stringToBytes(str);
    } catch (e) {
        throw new Error('Failed to decode string to bytes for EC point: ' + (e instanceof Error ? e.message : e));
    }
    try {
        return bytesToPoint(bytes);
    } catch (e) {
        throw new Error('Failed to parse EC point from string: ' + (e instanceof Error ? e.message : e));
    }
}

export function hexToPoint(xHex: string, yHex: string): any {
    const x = parseInt(xHex, 16);
    const y = parseInt(yHex, 16);
    return ec.curve.point(x, y);
}

export function privateToPublicKey(privateKeyHex: string): { point: any, compressed: string } {
    const key = ec.keyFromPrivate(privateKeyHex, 'hex');
    const point = key.getPublic();
    const prefix = point.getY() % 2 === 0 ? '02' : '03';
    const compressed = prefix + point.getX().toString(16).padStart(64, '0');
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
    if (walletVersion === '0.2.3') passphrase = '';
    if (!mnemonicPhrase) mnemonicPhrase = generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonicPhrase, passphrase);
    // Use BIP32 derivation (browser: use bip32 or bitcoinjs-lib if needed)
    // Here, we use the seed as private key for demo
    const privateKeyHex = bytesToHex(seed).slice(0, 64);
    const { point, compressed } = privateToPublicKey(privateKeyHex);
    const address = pointToString(point);
    const result: Wallet = {} as Wallet;
    if (deterministic) {
        if (!fields) fields = ['mnemonic', 'id', 'private_key', 'public_key', 'address'];
        if (fields.includes('mnemonic')) result.mnemonic = mnemonicPhrase;
        if (fields.includes('id')) result.id = index;
        if (fields.includes('private_key')) result.private_key = privateKeyHex;
        if (fields.includes('public_key')) result.public_key = compressed;
        if (fields.includes('address')) result.address = address;
    } else {
        if (!fields) fields = ['mnemonic', 'private_key', 'public_key', 'address'];
        if (fields.includes('mnemonic')) result.mnemonic = mnemonicPhrase;
        if (fields.includes('private_key')) result.private_key = privateKeyHex;
        if (fields.includes('public_key')) result.public_key = compressed;
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
}

// Browser-safe hex encoding/decoding
function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}
