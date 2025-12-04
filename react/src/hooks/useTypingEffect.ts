import { useState, useEffect } from 'react';

export const useTypingEffect = (text: string, isEnabled: boolean, speed: number = 15) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (isEnabled) {
            setIsTyping(true);
            let i = 0;
            setDisplayedText('');

            const interval = setInterval(() => {
                if (i < text.length) {
                    i++;
                    setDisplayedText(text.substring(0, i));
                } else {
                    clearInterval(interval);
                    setIsTyping(false);
                }
            }, speed);

            return () => clearInterval(interval);
        } else {
            setDisplayedText(text);
            setIsTyping(false);
        }
    }, [text, isEnabled, speed]);

    return { displayedText, isTyping };
};
