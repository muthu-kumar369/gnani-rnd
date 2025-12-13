import React from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../components/settings/SettingsModal';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();

    // In a full page context, we treat the modal as always open
    // onClose navigates back to the previous page (likely /chat)
    return (
        <div className="bg-jarvis-bg min-h-screen">
            <SettingsModal
                isOpen={true}
                onClose={() => navigate(-1)}
                initialTab="personalization"
            />
        </div>
    );
};

export default SettingsPage;
