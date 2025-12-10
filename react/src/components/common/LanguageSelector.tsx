import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const LanguageSelector: React.FC = () => {
    const { i18n, t } = useTranslation();

    const handleLanguageChange = (languageCode: string) => {
        i18n.changeLanguage(languageCode);
    };

    return (
        <div className="relative group">
            <button
                className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-cyan-500/30 rounded hover:border-cyan-500/50 transition-colors text-cyan-400"
                aria-label={t('language')}
            >
                <Globe size={16} />
                <span className="text-sm">
                    {LANGUAGES.find((lang) => lang.code === i18n.language)?.flag || '🌐'}
                </span>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-cyan-500/30 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {LANGUAGES.map((language) => (
                    <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${i18n.language === language.code
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'text-cyan-500/80 hover:bg-cyan-500/10 hover:text-cyan-400'
                            }`}
                    >
                        <span className="text-lg">{language.flag}</span>
                        <span>{language.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSelector;
