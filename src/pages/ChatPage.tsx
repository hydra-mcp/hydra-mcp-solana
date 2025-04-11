import React from 'react';
import { ChatProvider } from '@/components/ChatProvider';
import { ChatInterface } from '@/components/ChatInterface';
import { appRegistry } from '@/components/ios/AppRegistry';

interface ChatPageProps {
    isModal?: boolean;
    apiEndpoint?: string;
    appId?: string;
}

export function ChatPage({
    isModal = false,
    apiEndpoint = '/mcp/chat/completions',
    appId = 'messages'
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
                sidebarEnabled={!isModal}
            />
        </ChatProvider>
    );
} 