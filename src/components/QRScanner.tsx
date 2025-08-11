import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { XIcon, CameraIcon } from './Icons';
import { ReceiveQR } from '../pages/Popup/DataTypes';

interface QRScannerProps {
    onScan: (data: string | ReceiveQR) => void;
    onClose: () => void;
    isOpen: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);

    const handleScanResult = useCallback((text: string) => {
        try {
            // Try to parse as ReceiveQR JSON first
            const parsed = JSON.parse(text);
            if (parsed.address && typeof parsed.address === 'string') {
                // It's a valid ReceiveQR object
                onScan(parsed as ReceiveQR);
            } else {
                // It's some other JSON, treat as plain text
                onScan(text);
            }
        } catch {
            // Not JSON, treat as plain text (probably just an address)
            onScan(text);
        }
        
        if (codeReader.current) {
            codeReader.current.reset();
        }
        setIsScanning(false);
        onClose();
    }, [onScan, onClose]);

    const cleanup = useCallback(() => {
        if (codeReader.current) {
            codeReader.current.reset();
        }
        setIsScanning(false);
    }, []);

    const startScanning = useCallback(async () => {
        if (!codeReader.current || !videoRef.current) return;

        try {
            setIsScanning(true);
            setError('');

            const videoInputDevices = await codeReader.current.listVideoInputDevices();
            
            if (videoInputDevices.length === 0) {
                throw new Error('No camera devices found');
            }

            // Use the first available camera (usually rear camera)
            const selectedDevice = videoInputDevices[0];

            await codeReader.current.decodeFromVideoDevice(
                selectedDevice.deviceId,
                videoRef.current,
                (result, error) => {
                    if (result) {
                        handleScanResult(result.getText());
                    }
                    if (error && error.name !== 'NotFoundException') {
                        console.warn('QR scan error:', error);
                    }
                }
            );
        } catch (err) {
            console.error('Failed to start scanning:', err);
            setError('Failed to start camera. Please check your camera permissions.');
            setIsScanning(false);
        }
    }, [handleScanResult]);

    useEffect(() => {
        const initializeScanner = async () => {
            try {
                setError('');
                
                // Check for camera permission
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setHasPermission(true);
                
                // Stop the permission check stream
                stream.getTracks().forEach(track => track.stop());
                
                // Initialize the code reader
                codeReader.current = new BrowserMultiFormatReader();
                
                startScanning();
            } catch (err) {
                console.error('Camera permission denied or not available:', err);
                setHasPermission(false);
                setError('Camera access is required to scan QR codes. Please allow camera permission and try again.');
            }
        };

        if (isOpen) {
            initializeScanner();
        } else {
            cleanup();
        }

        return () => cleanup();
    }, [isOpen, startScanning, cleanup]);

    const handleRetry = () => {
        setError('');
        setHasPermission(null);
        // Re-trigger the effect by toggling state
        if (isOpen) {
            cleanup();
            setTimeout(() => {
                const initializeScanner = async () => {
                    try {
                        setError('');
                        
                        // Check for camera permission
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        setHasPermission(true);
                        
                        // Stop the permission check stream
                        stream.getTracks().forEach(track => track.stop());
                        
                        // Initialize the code reader
                        codeReader.current = new BrowserMultiFormatReader();
                        
                        startScanning();
                    } catch (err) {
                        console.error('Camera permission denied or not available:', err);
                        setHasPermission(false);
                        setError('Camera access is required to scan QR codes. Please allow camera permission and try again.');
                    }
                };
                initializeScanner();
            }, 100);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Scan QR Code</h2>
                    <button className="close-btn" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="scanner-content">
                        {hasPermission === false ? (
                            <div className="permission-error">
                                <CameraIcon className="camera-icon-large" />
                                <h3>Camera Permission Required</h3>
                                <p>Please allow camera access to scan QR codes</p>
                                <button className="retry-btn" onClick={handleRetry}>
                                    Try Again
                                </button>
                            </div>
                        ) : error ? (
                            <div className="scanner-error">
                                <p>{error}</p>
                                <button className="retry-btn" onClick={handleRetry}>
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="scanner-container">
                                <video
                                    ref={videoRef}
                                    className="scanner-video"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <div className="scanner-overlay">
                                    <div className="scanner-frame"></div>
                                </div>
                                {isScanning && (
                                    <div className="scanner-status">
                                        <p>Point your camera at a QR code</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
