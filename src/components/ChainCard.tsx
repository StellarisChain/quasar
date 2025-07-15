import React, { useState, useRef, useEffect } from 'react';
import { Token, ChainData, Wallet } from '../pages/Popup/DataTypes';
import { MiniChart } from './MiniChart';
import { Dropdown } from './Dropdown';
import { ChevronDownIcon, ArrowUpRightIcon, ArrowDownRightIcon } from './Icons';

// Chain Card Component
export const ChainCard = ({ chain }: { chain: ChainData }) => {
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const isPositive = chain.change24h >= 0;

  return (
    <div className="chain-card chain-card-anim">
      {/* Header Section */}
      <div className="chain-header">
        <div className="chain-info">
          <div
            className="chain-icon"
            style={{ backgroundColor: chain.color, transition: 'box-shadow 0.2s' }}
          >
            {chain.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="chain-name">{chain.name}</div>
            <div className="chain-balance">{chain.balance} {chain.symbol}</div>
          </div>
        </div>
        <div className="chain-value">
          <div className="fiat-value">
            ${chain.fiatValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`change-value ${isPositive ? 'positive' : 'negative'}`} style={{ transition: 'color 0.2s' }}>
            {isPositive ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
            <span>{isPositive ? '+' : ''}{chain.change24h.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <MiniChart
          data={chain.chartData}
          color={chain.color}
          positive={isPositive}
        />
      </div>

      {/* Tokens Dropdown */}
      <Dropdown
        trigger={
          <div className="tokens-trigger">
            <span>View Tokens ({chain.tokens.length})</span>
            <ChevronDownIcon />
          </div>
        }
        isOpen={isTokenMenuOpen}
        onToggle={() => setIsTokenMenuOpen(!isTokenMenuOpen)}
      >
        <div className="tokens-list">
          {chain.tokens.map((token, idx) => (
            <div key={idx} className="token-item token-anim">
              <div className="token-info">
                <div className="token-icon">
                  {token.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="token-symbol">{token.symbol}</div>
                  <div className="token-name">{token.name}</div>
                </div>
              </div>
              <div className="token-value">
                <div className="token-balance">{token.balance}</div>
                <div className={`token-change ${token.change24h >= 0 ? 'positive' : 'negative'}`}>
                  {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Dropdown>
    </div>
  );
};