import React, { useState } from 'react';
import SectionHeader from '../SectionHeader';
import DevicesSection from './DevicesSection';
import LinkedAccountsSection from './LinkedAccountsSection';
import ActivityHistorySection from './ActivityHistorySection';
import { Smartphone, Link as LinkIcon, Clock } from 'lucide-react';
import Button from '../../ui/Button';

type DataTab = 'devices' | 'accounts' | 'history';

const DataConnectorsSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DataTab>('devices');

    return (
        <div className="h-full flex flex-col pt-1">
            {/* Sub Tabs */}
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                <Button
                    variant={activeTab === 'devices' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('devices')}
                    size="sm"
                    className={`gap-1.5 text-xs font-bold uppercase tracking-wide h-8 ${activeTab === 'devices' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500'}`}
                >
                    <Smartphone size={14} />
                    Devices
                </Button>
                <Button
                    variant={activeTab === 'accounts' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('accounts')}
                    size="sm"
                    className={`gap-1.5 text-xs font-bold uppercase tracking-wide h-8 ${activeTab === 'accounts' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500'}`}
                >
                    <LinkIcon size={14} />
                    Linked Accounts
                </Button>
                <Button
                    variant={activeTab === 'history' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('history')}
                    size="sm"
                    className={`gap-1.5 text-xs font-bold uppercase tracking-wide h-8 ${activeTab === 'history' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500'}`}
                >
                    <Clock size={14} />
                    History
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-1">
                {activeTab === 'devices' && <DevicesSection />}
                {activeTab === 'accounts' && <LinkedAccountsSection />}
                {activeTab === 'history' && <ActivityHistorySection />}
            </div>
        </div>
    );
};

export default DataConnectorsSection;
