import React from 'react';
import { ChatPage } from './ChatPage';
import { AppType } from '@/components/ios/appConfig';

export function WalletFinder({ isModal = false }: { isModal?: boolean }) {
    return (
        <ChatPage
            isModal={isModal}
            apiEndpoint="/chat/completions"
            appId="walletFinder"
            appType={AppType.Agent}
        />
    );
} 