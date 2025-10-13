import React, { useState, useEffect, useCallback } from 'react';
import { SiteConnection } from '../pages/Popup/DataTypes';
import { GlobeIcon, ShieldIcon, ClockIcon, TrashIcon } from './Icons';
import { browserAPI } from '../lib/browser-compat';

interface ConnectedSitesProps {
    walletAddress: string;
}

interface MessageResponse {
    success: boolean;
    connections?: SiteConnection[];
    error?: string;
}

export const ConnectedSites: React.FC<ConnectedSitesProps> = ({ walletAddress }) => {
    const [connections, setConnections] = useState<SiteConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [disconnecting, setDisconnecting] = useState<string | null>(null);

    const loadConnections = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await browserAPI.runtime.sendMessage({
                type: 'GET_WALLET_SITE_CONNECTIONS',
                walletAddress
            }) as MessageResponse;

            if (response.success) {
                setConnections(response.connections || []);
            } else {
                setError(response.error || 'Failed to load connections');
            }
        } catch (err) {
            console.error('Failed to load site connections:', err);
            setError('Failed to load site connections');
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        loadConnections();
    }, [loadConnections]);

    const handleDisconnect = async (origin: string, hostname: string) => {
        // eslint-disable-next-line no-restricted-globals
        if (!confirm(`Disconnect from ${hostname}?\n\nThis site will need to request connection again to access your wallet.`)) {
            return;
        }

        try {
            setDisconnecting(origin);
            setError('');

            const response = await browserAPI.runtime.sendMessage({
                type: 'REMOVE_WALLET_SITE_CONNECTION',
                walletAddress,
                origin
            }) as MessageResponse;

            if (response.success) {
                // Remove from local state
                setConnections(prev => prev.filter(conn => conn.origin !== origin));
            } else {
                setError(response.error || 'Failed to disconnect');
            }
        } catch (err) {
            console.error('Failed to disconnect site:', err);
            setError('Failed to disconnect site');
        } finally {
            setDisconnecting(null);
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getPermissionsSummary = (connection: SiteConnection): string[] => {
        const perms: string[] = [];

        if (connection.permissions.returnPrivateKey) {
            perms.push('Private key access');
        }

        if (connection.permissions.specificAddress) {
            perms.push('Specific address');
        }

        if (connection.permissions.filter) {
            const f = connection.permissions.filter;
            if (f.curves) perms.push(`Curves: ${f.curves.join(', ')}`);
            if (f.assets) perms.push(`Assets: ${f.assets.join(', ')}`);
            if (f.chains) perms.push(`Chains: ${f.chains.join(', ')}`);
            if (f.minBalance) perms.push(`Min: $${f.minBalance}`);
        }

        if (perms.length === 0) {
            perms.push('Standard access');
        }

        return perms;
    };

    if (loading) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#9ca3af'
            }}>
                Loading connected sites...
            </div>
        );
    }

    return (
        <div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
            }}>
                <GlobeIcon />
                <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#fff'
                }}>
                    Connected Sites
                </h3>
                {connections.length > 0 && (
                    <span style={{
                        background: '#3a3a3a',
                        color: '#9ca3af',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}>
                        {connections.length}
                    </span>
                )}
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    color: '#ef4444',
                    fontSize: '14px'
                }}>
                    {error}
                </div>
            )}

            {connections.length === 0 ? (
                <div style={{
                    background: '#2a2a2a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '14px'
                }}>
                    <GlobeIcon style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No sites connected to this wallet yet.</p>
                    <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.8 }}>
                        When you connect to a site, it will appear here.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {connections.map((connection) => (
                        <div
                            key={connection.origin}
                            style={{
                                background: '#2a2a2a',
                                border: '1px solid #3a3a3a',
                                borderRadius: '8px',
                                padding: '16px',
                                transition: 'border-color 0.2s'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                marginBottom: '12px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '4px'
                                    }}>
                                        <GlobeIcon style={{ width: '16px', height: '16px', color: '#10b981' }} />
                                        <span style={{
                                            fontWeight: '600',
                                            color: '#fff',
                                            fontSize: '14px'
                                        }}>
                                            {connection.hostname}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        marginLeft: '24px',
                                        wordBreak: 'break-all'
                                    }}>
                                        {connection.origin}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDisconnect(connection.origin, connection.hostname)}
                                    disabled={disconnecting === connection.origin}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        cursor: disconnecting === connection.origin ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s',
                                        opacity: disconnecting === connection.origin ? 0.5 : 1
                                    }}
                                    onMouseEnter={(e) => {
                                        if (disconnecting !== connection.origin) {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    }}
                                >
                                    {disconnecting === connection.origin ? (
                                        'Disconnecting...'
                                    ) : (
                                        <>
                                            <TrashIcon style={{ width: '14px', height: '14px' }} />
                                            Disconnect
                                        </>
                                    )}
                                </button>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                paddingTop: '12px',
                                borderTop: '1px solid #3a3a3a'
                            }}>
                                {/* Permissions */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    fontSize: '12px'
                                }}>
                                    <ShieldIcon style={{ width: '14px', height: '14px', color: '#9ca3af', marginTop: '2px' }} />
                                    <div>
                                        <div style={{ color: '#9ca3af', marginBottom: '4px' }}>Permissions:</div>
                                        <div style={{ color: '#6b7280' }}>
                                            {getPermissionsSummary(connection).map((perm, idx) => (
                                                <div key={idx} style={{ marginBottom: '2px' }}>• {perm}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    fontSize: '12px',
                                    color: '#6b7280'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ClockIcon style={{ width: '14px', height: '14px' }} />
                                        Connected {formatDate(connection.connectedAt)}
                                    </div>
                                    {connection.lastUsed !== connection.connectedAt && (
                                        <div>
                                            Last used {formatDate(connection.lastUsed)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
