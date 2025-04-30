import React from 'react';
import { ChatPage } from './ChatPage';
import { AppType } from '@/components/ios/appConfig';

export function CaSignal() {
    return (
        <ChatPage
            apiEndpoint=""
            appId="caSignal"
            appType={AppType.Agent}
        />
    );
} 