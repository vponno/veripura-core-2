import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
    interface Window {
        gtag: (command: string, targetId: string, config?: any) => void;
    }
}

export const PageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        if (window.gtag) {
            window.gtag('config', 'G-QM233JCBKT', {
                page_path: location.pathname + location.search
            });
        }
    }, [location]);

    return null;
};
