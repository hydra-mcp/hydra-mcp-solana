import React from 'react';
import { ChatProvider } from '@/components/ChatProvider';
import { ChatInterface } from '@/components/ChatInterface';
import { appRegistry } from '@/components/ios/AppRegistry';

interface ChatPageProps {
    isModal?: boolean;
    apiEndpoint?: string;
    appId?: string;
    showScrollToBottom?: boolean; // 控制是否显示聊天界面中的"滚动到底部"按钮
}

export function ChatPage({
    isModal = false,
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
                sidebarEnabled={!isModal}
                showScrollToBottom={showScrollToBottom}
            />
        </ChatProvider>
    );
} 