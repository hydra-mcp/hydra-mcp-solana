import React from 'react';
import { ChatPage } from './ChatPage';
import { AppType } from '@/components/ios/appConfig';

export function HydraResearch() {
    return (
        <ChatPage
            apiEndpoint="/chat/completions"
            appId="hydraResearch"
            appType={AppType.System}
        />
    );
} 