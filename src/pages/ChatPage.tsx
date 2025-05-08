import React from 'react';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { appRegistry, AppType } from '@/components/ios/appConfig';

export interface ChatPageProps {
    isModal?: boolean;
    apiEndpoint?: string;
    appId?: string;
    showScrollToBottom?: boolean;
    scrollButtonThreshold?: number;
}

export function ChatPage({
    isModal = true,
    apiEndpoint = '/chat/completions',
    appId = '',
    showScrollToBottom = true,
    scrollButtonThreshold = 100
}: ChatPageProps) {
    // get application definition
    const app = appRegistry[appId];

    // Set up the appDefinition with ID
    const appDefinition = app ? { ...app } : undefined;

    return (
        <ChatProvider
            apiEndpoint={apiEndpoint}
            appDefinition={appDefinition ? { ...appDefinition, id: appId } : undefined}
            appType={app.appType}
            options={{
                enableHistory: true,
                historyStorageKey: `chat-history-${appId}`,
                scrollButtonThreshold
            }}
        >
            <ChatInterface
                modalMode={isModal}
                sidebarEnabled={true}
                showScrollToBottom={showScrollToBottom}
                scrollButtonThreshold={scrollButtonThreshold}
            />
        </ChatProvider>
    );
} 