import React from 'react';
import { useTranslation, SUPPORTED_LANGUAGES } from '../lib/i18n';

interface LanguageSelectorProps {
    compact?: boolean;
    className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false, className = '' }) => {
    const { language, setLanguage, t } = useTranslation();

    if (compact) {
        return (
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className={className}
                style={{
                    background: '#1a1a1a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                }}
            >
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.nativeName}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <div className={className}>
            <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#9ca3af',
                marginBottom: '8px'
            }}>
                {t('common.language')}
            </label>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
            }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        style={{
                            background: language === lang.code ? '#8b5cf6' : '#2a2a2a',
                            border: language === lang.code ? '2px solid #8b5cf6' : '1px solid #3a3a3a',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#fff',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                            if (language !== lang.code) {
                                e.currentTarget.style.borderColor = '#8b5cf6';
                                e.currentTarget.style.background = '#333';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (language !== lang.code) {
                                e.currentTarget.style.borderColor = '#3a3a3a';
                                e.currentTarget.style.background = '#2a2a2a';
                            }
                        }}
                    >
                        <span style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: language === lang.code ? '#fff' : '#e5e7eb'
                        }}>
                            {lang.nativeName}
                        </span>
                        <span style={{
                            fontSize: '11px',
                            color: language === lang.code ? '#c4b5fd' : '#9ca3af'
                        }}>
                            {lang.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
