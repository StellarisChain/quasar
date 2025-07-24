import React, { useState, useRef, useEffect } from 'react';
import { Token, ChainData, Wallet } from '../pages/Popup/DataTypes';
import { MiniChart } from './MiniChart';
import { Dropdown } from './Dropdown';
import { ChevronDownIcon, ArrowUpRightIcon, ArrowDownRightIcon } from './Icons';
import { getTokenImagePath } from '../pages/Popup/TokenImageUtil';
import './ChainCard.css';

// Chain Card Component
export const ChainCard = ({ chain }: { chain: ChainData }) => {
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const isPositive = chain.change24h >= 0;

  const [chainImagePath, setChainImagePath] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getTokenImagePath(chain.symbol).then((path) => {
      if (isMounted) setChainImagePath(path);
    });
    return () => {
      isMounted = false;
    };
  }, [chain.symbol]);

  return (
    <div className="chain-card chain-card-anim">
      {/* Header Section */}
      <div className="chain-header">
        <div className="chain-info">
          <div
            className="chain-icon"
            style={{ backgroundColor: chain.color, transition: 'box-shadow 0.2s' }}
          >
            {chainImagePath ? (
              <img src={chainImagePath} alt={`${chain.symbol} icon`} />
            ) : (
              chain.symbol.slice(0, 2).toUpperCase() // Fallback to first two letters
            )}
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
          // If token support is disabled, show a disabled state
          <div className="tokens-trigger"
            aria-disabled={!chain.tokenSupport}
            style={{
              cursor: chain.tokenSupport ? 'pointer' : 'not-allowed',
              opacity: chain.tokenSupport ? 1 : 0.6,
            }}
          >
            {/* Dropdown Button */}
            <span>View Tokens {chain.tokenSupport ? chain.tokens.length : ' (Disabled)'} {/*isTokenMenuOpen ? '▲' : '▼'*/}</span>
            <ChevronDownIcon />
          </div>
        }
        isOpen={isTokenMenuOpen}
        onToggle={() => setIsTokenMenuOpen(!isTokenMenuOpen)}
        enabled={chain.tokenSupport} // Only show if token support is enabled
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