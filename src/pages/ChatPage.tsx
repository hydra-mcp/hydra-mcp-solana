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
    // 获取应用定义
    const app = appRegistry[appId];

    // 如果找不到应用，使用默认消息应用
    const appDefinition = app || appRegistry['messages'];

    return (
        <ChatProvider
            apiEndpoint={apiEndpoint}
            appDefinition={appDefinition}
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