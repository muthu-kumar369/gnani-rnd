import React from 'react';
import SectionHeader from '../SectionHeader';
import { Info, Code, Heart } from 'lucide-react';

const AboutSection: React.FC = () => {
    return (
        <div>
            <SectionHeader
                title="About Gnani"
                description="System information and credits."
            />

            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                    <span className="text-4xl font-bold text-cyan-300">G</span>
                </div>

                <h2 className="text-3xl font-bold text-cyan-100 mb-2">Gnani Assistant</h2>
                <p className="text-cyan-400 mb-8">Version 2.0.0 (Beta)</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                    <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4 flex flex-col items-center">
                        <Code size={24} className="text-cyan-400 mb-2" />
                        <span className="text-cyan-200 font-medium">Build</span>
                        <span className="text-cyan-400/60 text-sm">2023.11.26.001</span>
                    </div>
                    <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4 flex flex-col items-center">
                        <Info size={24} className="text-cyan-400 mb-2" />
                        <span className="text-cyan-200 font-medium">Environment</span>
                        <span className="text-cyan-400/60 text-sm">Electron / React</span>
                    </div>
                </div>

                <div className="mt-12 text-cyan-400/40 text-sm flex items-center gap-1">
                    Made with <Heart size={12} className="text-red-400/60" /> by the Gnani Team
                </div>
            </div>
        </div>
    );
};

export default AboutSection;
