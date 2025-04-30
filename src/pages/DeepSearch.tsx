import React from 'react';
import { ChatPage } from './ChatPage';
import { AppType } from '@/components/ios/appConfig';

export function DeepSearch() {
    return (
        <ChatPage
            apiEndpoint=""
            appId="deepSearch"
            appType={AppType.System}
        />
    );
} 