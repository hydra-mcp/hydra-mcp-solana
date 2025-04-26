import React from 'react';
import { ChatPage } from './ChatPage';

export function WalletFinder({ isModal = false }: { isModal?: boolean }) {
    return (
        <ChatPage
            isModal={isModal}
            apiEndpoint="/agent/chat/completions"
            appId="walletFinder"
        />
    );
} 