import React from 'react';

const SkipLink: React.FC = () => {
    return (
        <a
            href="#main-content"
            className="skip-link sr-only-focusable"
        >
            Skip to main content
        </a>
    );
};

export default SkipLink;
