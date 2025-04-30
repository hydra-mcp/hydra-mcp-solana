import React from 'react';
import { ChatPage } from './ChatPage';
import { AppType } from '@/components/ios/appConfig';

export function SmartWallet() {
    return (
        <ChatPage
            apiEndpoint=""
            appId="smartWallet"
            appType={AppType.Pro}
        />
    );
} 