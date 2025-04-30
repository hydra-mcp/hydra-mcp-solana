import React from 'react';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { appRegistry, AppType } from '@/components/ios/appConfig';

export interface ChatPageProps {
    isModal?: boolean;
    apiEndpoint?: string;
    appId?: string;
    appType: AppType;
    showScrollToBottom?: boolean;
    scrollButtonThreshold?: number;
}

export function ChatPage({
    isModal = true,
    apiEndpoint = '/chat/completions',
    appId = '',
    appType,
    showScrollToBottom = true,
    scrollButtonThreshold = 100
}: ChatPageProps) {
    // get application definition
    const app = appRegistry[appId];

    // if no app is found, use the default messages app
    // Create a fallback app definition in case the app isn't found
    const defaultApp = appRegistry['messages'];
    const appDefinition = app || {
        ...defaultApp,
        id: appId,
        title: appId, // Use appId as title if no app definition is found
        suggestedQuestions: defaultApp.suggestedQuestions // Use default chat module texts
    };

    return (
        <ChatProvider
            apiEndpoint={apiEndpoint}
            appDefinition={appDefinition}
            appType={appType}
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