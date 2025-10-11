import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ru' | 'de' | 'fr';

export interface LanguageInfo {
    code: Language;
    name: string;
    nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English (US)' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'fr', name: 'French', nativeName: 'Français' }
];

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, vars?: Record<string, any>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
    children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const [translations, setTranslations] = useState<Record<string, any>>({});

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('quasar_language') as Language;
        if (savedLanguage && ['en', 'ru', 'de', 'fr'].includes(savedLanguage)) {
            setLanguageState(savedLanguage);
        }
    }, []);

    // Load translations when language changes
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const translations = await import(`./translations/${language}.json`);
                setTranslations(translations.default || translations);
            } catch (error) {
                console.error(`Failed to load translations for ${language}:`, error);
                // Fallback to English if translation file not found
                if (language !== 'en') {
                    const fallback = await import('./translations/en.json');
                    setTranslations(fallback.default || fallback);
                }
            }
        };
        loadTranslations();
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('quasar_language', lang);
    };

    const t = (key: string, vars?: Record<string, any>): string => {
        const keys = key.split('.');
        let value: any = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        let result = typeof value === 'string' ? value : key;

        // Replace variables in the format {{varName}}
        if (vars && typeof result === 'string') {
            Object.keys(vars).forEach(varKey => {
                result = result.replace(new RegExp(`{{${varKey}}}`, 'g'), String(vars[varKey]));
            });
        }

        return result;
    };

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
