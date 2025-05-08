import React from 'react';
import { ChatPage } from './ChatPage';
import { AppType } from '@/components/ios/appConfig';

export function WalletFinder({ isModal = false }: { isModal?: boolean }) {
    // The appId matches the key in appRegistry
    const appId = 'walletFinder';

    return (
        <ChatPage
            isModal={isModal}
            apiEndpoint="/chat/completions"
            appId={appId}
        />
    );
} 