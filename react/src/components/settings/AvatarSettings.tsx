import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import errorLogger from '../../utils/errorLogger';

const AvatarSettings: React.FC = () => {
    const { user, updateSettings } = useUserStore();
    const avatarEnabled = user?.settings?.avatarEnabled ?? true;
    const avatarGender = user?.settings?.avatarGender ?? 'female';

    const handleToggleAvatar = async (enabled: boolean) => {
        try {
            await updateSettings({ avatarEnabled: enabled });
        } catch (error) {
            errorLogger.error('Failed to save avatar enabled setting', error as Error, { context: 'AvatarSettings' });
        }
    };

    const handleGenderChange = async (gender: 'male' | 'female') => {
        try {
            await updateSettings({ avatarGender: gender });
        } catch (error) {
            errorLogger.error('Failed to save avatar gender setting', error as Error, { context: 'AvatarSettings' });
        }
    };

    return (
        <div className="space-y-8 mt-8">
            <div className="flex items-center justify-between p-4 bg-jarvis-panel/50 border border-jarvis-border rounded-sm">
                <div>
                    <h3 className="text-jarvis-cyan font-medium tracking-wide">HOLOGRAPHIC AVATAR</h3>
                    <p className="text-xs text-jarvis-cyan/60 mt-1 font-mono">Enable photorealistic AI projection</p>
                </div>
                <button
                    onClick={() => handleToggleAvatar(!avatarEnabled)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative border ${avatarEnabled
                        ? 'bg-jarvis-blue/20 border-jarvis-blue shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-gray-900/50 border-gray-700'
                        }`}
                >
                    <div className={`absolute top-1 w-3.5 h-3.5 rounded-full transition-all duration-300 ${avatarEnabled
                        ? 'left-7 bg-jarvis-cyan shadow-[0_0_8px_#00f0ff]'
                        : 'left-1 bg-gray-500'
                        }`} />
                </button>
            </div>

            {avatarEnabled && (
                <div className="space-y-4 animate-fadeIn">
                    <label className="block text-xs text-jarvis-cyan/60 font-mono uppercase tracking-wider mb-3">Avatar Gender</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleGenderChange('male')}
                            className={`p-4 rounded-sm border transition-all duration-300 flex flex-col items-center gap-2 group ${avatarGender === 'male'
                                ? 'border-jarvis-cyan bg-jarvis-cyan/10 shadow-[inset_0_0_20px_rgba(0,240,255,0.1)]'
                                : 'border-jarvis-border bg-jarvis-panel/30 hover:border-jarvis-blue/50 hover:bg-jarvis-blue/5'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${avatarGender === 'male' ? 'bg-jarvis-cyan shadow-[0_0_8px_#00f0ff]' : 'bg-gray-600'}`} />
                            <span className={`font-mono text-sm tracking-wide ${avatarGender === 'male' ? 'text-jarvis-cyan' : 'text-gray-400 group-hover:text-jarvis-cyan/80'}`}>MALE</span>
                        </button>
                        <button
                            onClick={() => handleGenderChange('female')}
                            className={`p-4 rounded-sm border transition-all duration-300 flex flex-col items-center gap-2 group ${avatarGender === 'female'
                                ? 'border-jarvis-cyan bg-jarvis-cyan/10 shadow-[inset_0_0_20px_rgba(0,240,255,0.1)]'
                                : 'border-jarvis-border bg-jarvis-panel/30 hover:border-jarvis-blue/50 hover:bg-jarvis-blue/5'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${avatarGender === 'female' ? 'bg-jarvis-cyan shadow-[0_0_8px_#00f0ff]' : 'bg-gray-600'}`} />
                            <span className={`font-mono text-sm tracking-wide ${avatarGender === 'female' ? 'text-jarvis-cyan' : 'text-gray-400 group-hover:text-jarvis-cyan/80'}`}>FEMALE</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvatarSettings;
