import React, { useState, useRef, useEffect } from 'react';
import { Token, ChainData, Wallet } from './DataTypes';

// LocalStorage Keys
export const WALLET_STORAGE_KEY = 'quasar_wallets';

// Default Wallet Data (just for testing)
// Default wallet data (structure only, no price values)
export const defaultWallets: Wallet[] = [
    {
        id: '1',
        name: 'Main Wallet',
        address: '0xA1b2...C3d4',
        chains: [
            {
                name: 'Ethereum', symbol: 'ETH', balance: '2.345', fiatValue: 0, change24h: 0, color: '#627EEA', chartData: [2100, 2150, 2200, 2180, 2220, 2300, 2250, 2280, 2320, 2350, 2400, 2380], tokens: [
                    { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00', price: 0, change24h: 0 },
                    { symbol: 'UNI', name: 'Uniswap', balance: '45.2', price: 0, change24h: 0 },
                    { symbol: 'LINK', name: 'Chainlink', balance: '12.8', price: 0, change24h: 0 },
                ],
            },
            {
                name: 'Solana', symbol: 'SOL', balance: '15.67', fiatValue: 0, change24h: 0, color: '#9945FF', chartData: [80, 82, 78, 85, 88, 84, 86, 89, 87, 90, 88, 85], tokens: [
                    { symbol: 'USDC', name: 'USD Coin (Solana)', balance: '500.00', price: 0, change24h: 0 },
                    { symbol: 'RAY', name: 'Raydium', balance: '230.5', price: 0, change24h: 0 },
                    { symbol: 'BONK', name: 'Bonk', balance: '1,000,000', price: 0, change24h: 0 },
                ],
            },
            {
                name: 'Stellaris', symbol: 'STE', balance: '158.67', fiatValue: 0, change24h: 0, color: '#9945FF', chartData: [80, 82, 78, 85, 88, 84, 86, 89, 87, 90, 88, 85], tokens: [],
            },
            {
                name: 'Halogen', symbol: 'HAL', balance: '2759.65', fiatValue: 0, change24h: 0, color: '#ff4545ff', chartData: [80, 60, 40, 150, 230, 184, 416, 380, 259, 210, 313, 185, 180], tokens: [],
            },
        ],
    },
    {
        id: '2',
        name: 'Trading Wallet',
        address: '0xF1e2...B3c4',
        chains: [
            {
                name: 'Ethereum', symbol: 'ETH', balance: '0.892', fiatValue: 0, change24h: 0, color: '#627EEA', chartData: [2100, 2150, 2200, 2180, 2220, 2300, 2250, 2280, 2320, 2350, 2400, 2380], tokens: [
                    { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '0.5', price: 0, change24h: 0 },
                    { symbol: 'USDT', name: 'Tether', balance: '5,000.00', price: 0, change24h: 0 },
                ],
            },
        ],
    },
];

// Load wallets from localStorage
export const getStoredWallets = () => {
    try {
        const raw = localStorage.getItem(WALLET_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { }
    return defaultWallets;
};

// Save wallets to localStorage
export const saveWallets = (wallets: Wallet[]) => {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
};