import React from 'react';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { appRegistry } from '@/components/ios/appConfig';

interface ChatPageProps {
    isModal?: boolean;
    apiEndpoint?: string;
    appId?: string;
    showScrollToBottom?: boolean;
    scrollButtonThreshold?: number;
}

export function ChatPage({
    isModal = true,
    apiEndpoint = '/mcp/chat/completions',
    appId = 'messages',
    showScrollToBottom = true,
    scrollButtonThreshold = 100
}: ChatPageProps) {
    // get application definition
    const app = appRegistry[appId];

    // if no app is found, use the default messages app
    const appDefinition = app || appRegistry['messages'];

    return (
        <ChatProvider
            apiEndpoint={apiEndpoint}
            appDefinition={appDefinition}
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