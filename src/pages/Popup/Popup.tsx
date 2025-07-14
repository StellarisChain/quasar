import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import logo from '../../assets/img/logo.svg';
import {
  Menu,
  Card,
  Button,
  CardBody,
  MenuItem,
  MenuList,
  CardHeader,
  Typography,
  MenuHandler,
} from "@material-tailwind/react";
import { 
  ChevronDownIcon, 
  WalletIcon, 
  ArrowUpRightIcon, 
  ArrowDownRightIcon,
  EllipsisVerticalIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";
import merge from "deepmerge";
import './Popup.css';

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

import type { ApexAxisChartSeries } from "apexcharts";

// Types
interface Token {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  change24h: number;
  icon?: string;
}

interface ChainData {
  name: string;
  symbol: string;
  balance: string;
  fiatValue: number;
  change24h: number;
  tokens: Token[];
  chartData: number[];
  color: string;
  icon?: string;
}

interface Wallet {
  id: string;
  name: string;
  address: string;
  chains: ChainData[];
}

// Mini Chart Component
const MiniChart = ({ data, color, positive }: { data: number[]; color: string; positive: boolean }) => {
  const chartOptions = {
    chart: {
      type: 'area',
      height: 40,
      sparkline: { enabled: true },
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 1.5,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.2,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    colors: [color],
    tooltip: { enabled: false },
    grid: { show: false },
    xaxis: { labels: { show: false } },
    yaxis: { labels: { show: false } },
  };

  return (
    <div className="w-full h-[40px] flex items-center">
      <Chart
        type="area"
        height={40}
        series={[{ data }]}
        options={chartOptions}
      />
    </div>
  );
};

// Chain Card Component
const ChainCard = ({ chain }: { chain: ChainData }) => {
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const isPositive = chain.change24h >= 0;

  return (
    <div className="bg-[#1a1625] rounded-xl p-3 border border-[#2d2346] hover:border-purple-500/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: chain.color }}
          >
            {chain.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="text-white font-medium text-sm">{chain.name}</div>
            <div className="text-gray-400 text-xs">{chain.balance} {chain.symbol}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-semibold text-sm">
            ${chain.fiatValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <ArrowUpRightIcon className="w-3 h-3" />
            ) : (
              <ArrowDownRightIcon className="w-3 h-3" />
            )}
            <span className="text-xs font-medium">
              {isPositive ? '+' : ''}{chain.change24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <MiniChart 
          data={chain.chartData} 
          color={chain.color} 
          positive={isPositive}
        />
      </div>

      <Menu open={isTokenMenuOpen} handler={setIsTokenMenuOpen}>
        <MenuHandler>
          <button className="w-full flex items-center justify-between p-2 text-gray-300 hover:bg-[#2d2346] rounded-lg transition-colors text-sm">
            <span>Tokens ({chain.tokens.length})</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isTokenMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </MenuHandler>
        <MenuList className="bg-[#1a1625] border-purple-500/30 max-h-40 overflow-y-auto w-full">
          {chain.tokens.map((token, idx) => (
            <MenuItem key={idx} className="text-white hover:bg-[#2d2346] p-2">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{token.symbol}</div>
                    <div className="text-gray-400 text-xs">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">{token.balance}</div>
                  <div className={`text-xs ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </div>
  );
};

// Wallet Selector Component
const WalletSelector = ({ wallets, selectedWallet, onWalletChange }: {
  wallets: Wallet[];
  selectedWallet: Wallet;
  onWalletChange: (wallet: Wallet) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Menu open={isOpen} handler={setIsOpen}>
      <MenuHandler>
        <button className="flex items-center gap-2 bg-[#1a1625] hover:bg-[#2d2346] px-3 py-2 rounded-lg transition-colors border border-[#2d2346]">
          <WalletIcon className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-medium truncate max-w-[100px]">
            {selectedWallet.name}
          </span>
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </MenuHandler>
      <MenuList className="bg-[#1a1625] border-purple-500/30">
        {wallets.map((wallet) => (
          <MenuItem
            key={wallet.id}
            onClick={() => onWalletChange(wallet)}
            className={`text-white hover:bg-[#2d2346] p-3 ${selectedWallet.id === wallet.id ? 'bg-[#2d2346]' : ''}`}
          >
            <div>
              <div className="text-white text-sm font-medium">{wallet.name}</div>
              <div className="text-gray-400 text-xs font-mono">{wallet.address}</div>
            </div>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const Popup = () => {
  // Mock wallet data
  const wallets: Wallet[] = [
    {
      id: '1',
      name: 'Main Wallet',
      address: '0xA1b2...C3d4',
      chains: [
        {
          name: 'Ethereum',
          symbol: 'ETH',
          balance: '2.345',
          fiatValue: 7123.45,
          change24h: 3.2,
          color: '#627EEA',
          chartData: [2100, 2150, 2200, 2180, 2220, 2300, 2250, 2280, 2320, 2350, 2400, 2380],
          tokens: [
            { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00', price: 1.00, change24h: 0.1 },
            { symbol: 'UNI', name: 'Uniswap', balance: '45.2', price: 6.80, change24h: -2.3 },
            { symbol: 'LINK', name: 'Chainlink', balance: '12.8', price: 14.50, change24h: 5.7 },
          ],
        },
        {
          name: 'Solana',
          symbol: 'SOL',
          balance: '15.67',
          fiatValue: 1245.30,
          change24h: -1.8,
          color: '#9945FF',
          chartData: [80, 82, 78, 85, 88, 84, 86, 89, 87, 90, 88, 85],
          tokens: [
            { symbol: 'USDC', name: 'USD Coin (Solana)', balance: '500.00', price: 1.00, change24h: 0.0 },
            { symbol: 'RAY', name: 'Raydium', balance: '230.5', price: 0.85, change24h: 4.2 },
            { symbol: 'BONK', name: 'Bonk', balance: '1,000,000', price: 0.000012, change24h: -8.5 },
          ],
        },
        {
          name: 'Polygon',
          symbol: 'MATIC',
          balance: '1,234.56',
          fiatValue: 987.65,
          change24h: 2.1,
          color: '#8247E5',
          chartData: [0.78, 0.82, 0.80, 0.85, 0.88, 0.84, 0.87, 0.89, 0.86, 0.88, 0.85, 0.87],
          tokens: [
            { symbol: 'USDC', name: 'USD Coin (Polygon)', balance: '750.00', price: 1.00, change24h: 0.0 },
            { symbol: 'AAVE', name: 'Aave', balance: '8.5', price: 92.50, change24h: 1.8 },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'Trading Wallet',
      address: '0xF1e2...B3c4',
      chains: [
        {
          name: 'Ethereum',
          symbol: 'ETH',
          balance: '0.892',
          fiatValue: 2710.80,
          change24h: 3.2,
          color: '#627EEA',
          chartData: [2100, 2150, 2200, 2180, 2220, 2300, 2250, 2280, 2320, 2350, 2400, 2380],
          tokens: [
            { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '0.5', price: 3040.00, change24h: 3.2 },
            { symbol: 'USDT', name: 'Tether', balance: '5,000.00', price: 1.00, change24h: -0.1 },
          ],
        },
      ],
    },
  ];

  const [selectedWallet, setSelectedWallet] = useState<Wallet>(wallets[0]);

  // Calculate total portfolio value
  const totalValue = selectedWallet.chains.reduce((sum, chain) => sum + chain.fiatValue, 0);
  const totalChange = selectedWallet.chains.reduce((sum, chain, _, arr) => 
    sum + (chain.change24h * chain.fiatValue / totalValue), 0
  );

  return (
    <div className="w-[360px] h-[600px] bg-[#0f0d1a] text-white overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2d2346]">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Wallet Logo" className="w-7 h-7" />
            <span className="text-purple-300 font-semibold text-lg">Quasar</span>
          </div>
          <WalletSelector
            wallets={wallets}
            selectedWallet={selectedWallet}
            onWalletChange={setSelectedWallet}
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Total Balance */}
            <div className="bg-[#1a1625] rounded-xl p-4 border border-[#2d2346]">
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Total Portfolio Value</div>
                <div className="text-white text-2xl font-bold mb-2">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center justify-center gap-1 ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalChange >= 0 ? (
                    <ArrowUpRightIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownRightIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}% (24h)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                <ArrowsRightLeftIcon className="w-4 h-4" />
                <span className="text-sm">Send</span>
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                <PlusIcon className="w-4 h-4" />
                <span className="text-sm">Receive</span>
              </button>
              <button className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                <CreditCardIcon className="w-4 h-4" />
                <span className="text-sm">Buy</span>
              </button>
            </div>

            {/* Chain Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-medium">
                  Assets ({selectedWallet.chains.length})
                </span>
                <button className="text-purple-400 hover:text-purple-300 text-sm">
                  Manage
                </button>
              </div>
              {selectedWallet.chains.map((chain, idx) => (
                <ChainCard key={idx} chain={chain} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;