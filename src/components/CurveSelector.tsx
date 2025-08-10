import React from 'react';

export interface CurveSelectorProps {
    selectedCurve: string;
    onCurveChange: (curve: string) => void;
    availableCurves?: string[];
    disabled?: boolean;
}

interface CurveInfo {
    id: string;
    name: string;
    description: string;
    recommended?: boolean;
}

const CURVE_INFO: Record<string, CurveInfo> = {
    'secp256k1': {
        id: 'secp256k1',
        name: 'secp256k1',
        description: 'Standard Bitcoin/Ethereum curve. Widely supported.',
        recommended: true
    },
    'p256': {
        id: 'p256',
        name: 'P-256',
        description: 'NIST P-256 curve. Used by some specialized networks.'
    }
};

export const CurveSelector: React.FC<CurveSelectorProps> = ({
    selectedCurve,
    onCurveChange,
    availableCurves = ['secp256k1', 'p256'],
    disabled = false
}) => {
    return (
        <div className="curve-selector" style={{ marginBottom: '20px' }}>
            <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#e5e7eb',
                marginBottom: '8px'
            }}>
                Cryptographic Curve
            </label>
            <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '12px',
                lineHeight: '1.4'
            }}>
                Choose the cryptographic curve for your wallet. Only assets that support this curve will be available.
            </p>

            <div className="curve-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableCurves.map((curveId) => {
                    const curveInfo = CURVE_INFO[curveId];
                    if (!curveInfo) return null;

                    const isSelected = selectedCurve === curveId;

                    return (
                        <div
                            key={curveId}
                            className={`curve-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => !disabled && onCurveChange(curveId)}
                            style={{
                                background: isSelected ? '#374151' : '#2a2a2a',
                                border: isSelected ? '2px solid #8b5cf6' : '1px solid #3a3a3a',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: disabled ? 0.6 : 1,
                                position: 'relative'
                            }}
                        >
                            {curveInfo.recommended && (
                                <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: '#10b981',
                                    color: 'white',
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Recommended
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px'
                            }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    border: '2px solid #8b5cf6',
                                    background: isSelected ? '#8b5cf6' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {isSelected && (
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: 'white'
                                        }} />
                                    )}
                                </div>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#e5e7eb'
                                }}>
                                    {curveInfo.name}
                                </span>
                            </div>

                            <p style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                margin: '0 0 0 20px',
                                lineHeight: '1.3'
                            }}>
                                {curveInfo.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
