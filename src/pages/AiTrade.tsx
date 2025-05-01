import React from 'react';
import { ChatPage } from './ChatPage';
import { AppType } from '@/components/ios/appConfig';

export function AiTrade() {
    return (
        <ChatPage
            apiEndpoint=""
            appId="aiTrade"
            appType={AppType.Pro}
        />
    );
} 