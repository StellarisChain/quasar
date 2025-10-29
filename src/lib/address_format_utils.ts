/**
 * Address format utilities for Stellaris/Denaro and Ethereum-compatible addresses
 * 
 * This module provides functionality to:
 * - Generate both Stellaris native (D/E prefix) and Ethereum (0x prefix) addresses
 * - Convert between address formats
 * - Validate addresses in both formats
 * - Detect address format type
 */

import bs58 from 'bs58';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes, pointToBytes, AddressFormat } from './wallet_generation_utils';

export enum AddressType {
    STELLARIS = 'stellaris',  // D/E prefix (base58)
    ETHEREUM = 'ethereum',    // 0x prefix (hex)
    UNKNOWN = 'unknown'
}

/**
 * Detect the type of an address
 */
export function detectAddressType(address: string): AddressType {
    if (!address) return AddressType.UNKNOWN;
    
    // Ethereum addresses start with 0x and are 42 characters long (0x + 40 hex chars)
    if (address.startsWith('0x') && address.length === 42) {
        return AddressType.ETHEREUM;
    }
    
    // Stellaris addresses start with D or E (base58 encoded)
    if ((address.startsWith('D') || address.startsWith('E')) && address.length > 30) {
        return AddressType.STELLARIS;
    }
    
    return AddressType.UNKNOWN;
}

/**
 * Validate a Stellaris native address (D/E prefix)
 */
export function isValidStellarisAddress(address: string): boolean {
    try {
        // Must start with D or E
        if (!address.startsWith('D') && !address.startsWith('E')) {
            return false;
        }
        
        // Decode base58
        const decoded = bs58.decode(address);
        
        // Should be 33 bytes (1 prefix + 32 x-coordinate)
        if (decoded.length !== 33) {
            return false;
        }
        
        // Prefix should be 42 (D) or 43 (E)
        if (decoded[0] !== 42 && decoded[0] !== 43) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validate an Ethereum address (0x prefix)
 */
export function isValidEthereumAddress(address: string): boolean {
    try {
        // Must start with 0x
        if (!address.startsWith('0x')) {
            return false;
        }
        
        // Must be 42 characters (0x + 40 hex characters)
        if (address.length !== 42) {
            return false;
        }
        
        // Must be valid hex
        const hex = address.slice(2);
        if (!/^[0-9a-fA-F]{40}$/.test(hex)) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validate an address of any supported type
 */
export function isValidAddress(address: string): boolean {
    return isValidStellarisAddress(address) || isValidEthereumAddress(address);
}

/**
 * Generate Ethereum address from public key point
 * Ethereum addresses are the last 20 bytes of the Keccak-256 hash of the public key
 */
export function generateEthereumAddress(publicKeyPoint: any): string {
    // Get uncompressed public key (64 bytes: x + y coordinates, no prefix)
    const publicKeyBytes = pointToBytes(publicKeyPoint, AddressFormat.FULL_HEX);
    
    // Hash with Keccak-256
    const hash = keccak_256(publicKeyBytes);
    
    // Take last 20 bytes
    const addressBytes = hash.slice(-20);
    
    // Convert to hex with 0x prefix
    return '0x' + bytesToHex(addressBytes);
}

/**
 * Generate Stellaris address from public key point
 * Stellaris addresses use base58 encoding with prefix 42 (D) or 43 (E)
 */
export function generateStellarisAddress(publicKeyPoint: any): string {
    // Get compressed public key (33 bytes with custom Stellaris prefix)
    const publicKeyBytes = pointToBytes(publicKeyPoint, AddressFormat.COMPRESSED);
    
    // Encode with base58
    return bs58.encode(publicKeyBytes);
}

/**
 * Generate both address formats from a public key point
 */
export function generateAddresses(publicKeyPoint: any): {
    stellaris: string;
    ethereum: string;
} {
    return {
        stellaris: generateStellarisAddress(publicKeyPoint),
        ethereum: generateEthereumAddress(publicKeyPoint)
    };
}

/**
 * Convert Stellaris address to Ethereum address
 * Note: This requires reconstructing the public key from the Stellaris address,
 * which is only possible if we have the full public key point
 */
export function stellarisToEthereum(stellarisAddress: string, publicKeyPoint: any): string {
    if (!isValidStellarisAddress(stellarisAddress)) {
        throw new Error('Invalid Stellaris address');
    }
    return generateEthereumAddress(publicKeyPoint);
}

/**
 * Get the display address in the specified format
 */
export function getAddressInFormat(
    publicKeyPoint: any,
    format: AddressType
): string {
    if (format === AddressType.ETHEREUM) {
        return generateEthereumAddress(publicKeyPoint);
    } else {
        return generateStellarisAddress(publicKeyPoint);
    }
}

/**
 * Shorten an address for display (e.g., "0x1234...5678" or "DhKf...8MuW")
 */
export function shortenAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address || address.length <= startChars + endChars + 3) {
        return address;
    }
    
    const addressType = detectAddressType(address);
    
    // For Ethereum addresses, keep the 0x prefix
    if (addressType === AddressType.ETHEREUM) {
        return `${address.slice(0, startChars + 2)}...${address.slice(-endChars)}`;
    }
    
    // For Stellaris addresses
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format address with proper checksum for Ethereum addresses (EIP-55)
 */
export function formatAddressWithChecksum(address: string): string {
    const addressType = detectAddressType(address);
    
    if (addressType === AddressType.ETHEREUM) {
        // Implement EIP-55 checksum
        const lowerAddress = address.toLowerCase().replace('0x', '');
        const hash = bytesToHex(keccak_256(new TextEncoder().encode(lowerAddress)));
        
        let checksumAddress = '0x';
        for (let i = 0; i < lowerAddress.length; i++) {
            if (parseInt(hash[i], 16) >= 8) {
                checksumAddress += lowerAddress[i].toUpperCase();
            } else {
                checksumAddress += lowerAddress[i];
            }
        }
        return checksumAddress;
    }
    
    // For Stellaris addresses, return as-is
    return address;
}

/**
 * Get address info including type and validity
 */
export function getAddressInfo(address: string): {
    type: AddressType;
    isValid: boolean;
    formatted: string;
} {
    const type = detectAddressType(address);
    const isValid = isValidAddress(address);
    const formatted = type === AddressType.ETHEREUM ? formatAddressWithChecksum(address) : address;
    
    return { type, isValid, formatted };
}
