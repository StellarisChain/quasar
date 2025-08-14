import React, { useState, useEffect } from 'react';
import Popup from '../Popup/Popup';
import './WebWallet.css';

interface WebWalletProps {
    isMobile: boolean;
}

const WebWallet: React.FC<WebWalletProps> = ({ isMobile }) => {
    const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>(isMobile ? 'mobile' : 'desktop');

    // Handle window resize for responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setDeviceType(newIsMobile ? 'mobile' : 'desktop');

            // Update body classes
            if (newIsMobile) {
                document.body.classList.remove('desktop-device');
                document.body.classList.add('mobile-device');
            } else {
                document.body.classList.remove('mobile-device');
                document.body.classList.add('desktop-device');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent zoom on double tap for mobile Safari
    useEffect(() => {
        if (deviceType === 'mobile') {
            let lastTouchEnd = 0;
            const handleTouchEnd = (e: TouchEvent) => {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            };

            document.addEventListener('touchend', handleTouchEnd, { passive: false });
            return () => document.removeEventListener('touchend', handleTouchEnd);
        }
    }, [deviceType]);

    return (
        <div className={`web-wallet web-wallet-${deviceType}`}>
            {/* Background pattern for desktop */}
            {deviceType === 'desktop' && (
                <div className="desktop-background">
                    <div className="background-grid"></div>
                    <div className="background-overlay"></div>
                </div>
            )}

            {/* Main wallet component - reuse the existing Popup component */}
            <Popup />

            {/* Device indicator for development (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="device-indicator">
                    {deviceType} - {window.innerWidth}x{window.innerHeight}
                </div>
            )}
        </div>
    );
};

export default WebWallet;
