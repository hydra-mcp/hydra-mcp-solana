import React from 'react';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { appRegistry } from '@/components/ios/appConfig';

interface ChatPageProps {
    isModal?: boolean;
    apiEndpoint?: string;
    appId?: string;
    showScrollToBottom?: boolean;
}

export function ChatPage({
    isModal = true,
    apiEndpoint = '/mcp/chat/completions',
    appId = 'messages',
    showScrollToBottom = true
}: ChatPageProps) {
    // Get application definition, use the definition in appRegistry directly
    const app = appRegistry[appId];

    return (
        <ChatProvider
            apiEndpoint={apiEndpoint}
            appDefinition={app}
            options={{
                enableHistory: true,
                historyStorageKey: `chat-history-${appId}`
            }}
        >
            <ChatInterface
                modalMode={isModal}
                sidebarEnabled={true}
                showScrollToBottom={showScrollToBottom}
            />
        </ChatProvider>
    );
} 