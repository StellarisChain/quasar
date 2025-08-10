import React, { useState, useEffect } from 'react';
import { loadTokensXmlAsJson, filterTokensByCurve, Chain } from '../lib/token_loader';

interface CompatibleAssetsDisplayProps {
    curve: string;
    maxDisplay?: number;
}

export const CompatibleAssetsDisplay: React.FC<CompatibleAssetsDisplayProps> = ({
    curve,
    maxDisplay = 3
}) => {
    const [compatibleAssets, setCompatibleAssets] = useState<Chain[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAssets = async () => {
            setLoading(true);
            try {
                const tokens = await loadTokensXmlAsJson('tokens.xml');
                const filtered = filterTokensByCurve(tokens, curve);
                setCompatibleAssets(filtered);
            } catch (error) {
                console.warn('Could not load tokens for curve display:', error);
                setCompatibleAssets([]);
            } finally {
                setLoading(false);
            }
        };

        loadAssets();
    }, [curve]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#9ca3af'
            }}>
                <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid #3a3a3a',
                    borderTop: '2px solid #8b5cf6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                Loading compatible assets...
            </div>
        );
    }

    if (compatibleAssets.length === 0) {
        return (
            <div style={{
                fontSize: '12px',
                color: '#ef4444',
                fontStyle: 'italic'
            }}>
                No compatible assets found for {curve}
            </div>
        );
    }

    const displayAssets = compatibleAssets.slice(0, maxDisplay);
    const remainingCount = compatibleAssets.length - maxDisplay;

    return (
        <div className="compatible-assets">
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center'
            }}>
                {displayAssets.map((asset, index) => (
                    <div
                        key={asset.Symbol}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: asset.Color ? `${asset.Color}20` : '#374151',
                            border: `1px solid ${asset.Color || '#4b5563'}`,
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '500'
                        }}
                    >
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: asset.Color || '#8b5cf6'
                            }}
                        />
                        <span style={{ color: '#e5e7eb' }}>
                            {asset.Symbol}
                        </span>
                    </div>
                ))}

                {remainingCount > 0 && (
                    <span style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        fontStyle: 'italic'
                    }}>
                        +{remainingCount} more
                    </span>
                )}
            </div>

            <div style={{
                fontSize: '10px',
                color: '#6b7280',
                marginTop: '4px'
            }}>
                {compatibleAssets.length} asset{compatibleAssets.length !== 1 ? 's' : ''} support {curve}
            </div>
        </div>
    );
};
