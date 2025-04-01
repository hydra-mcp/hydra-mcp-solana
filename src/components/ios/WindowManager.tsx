import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppWindow } from '@/contexts/AppWindowContext';
import { AppWindow } from './AppWindow';

export const WindowManager: React.FC = () => {
    const { openWindows } = useAppWindow();

    return (
        <div className="fixed inset-0 pointer-events-none z-40">
            <AnimatePresence>
                {openWindows.map(window => (
                    <div key={window.id} className="pointer-events-auto">
                        <AppWindow window={window} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}; 