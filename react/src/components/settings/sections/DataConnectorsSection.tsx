import React from 'react';
import LinkedAccountsSection from './LinkedAccountsSection';

const DataConnectorsSection: React.FC = () => {
    return (
        <div className="h-full flex flex-col pt-1">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-1">
                <LinkedAccountsSection />
            </div>
        </div>
    );
};

export default DataConnectorsSection;
