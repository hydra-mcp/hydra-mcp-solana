import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppDefinition, appRegistry } from './appConfig';

// Re-export the AppDefinition interface to maintain backward compatibility
export type { AppDefinition };

// Helper function to get default app position
export const getDefaultAppPosition = (size: { width: number | string; height: number | string }) => {
    const screenWidth = globalThis.window?.innerWidth || 1200;
    const screenHeight = globalThis.window?.innerHeight || 800;

    // Convert size to pixels if percentage
    const width = typeof size.width === 'string' && size.width.includes('%')
        ? screenWidth * (parseInt(size.width) / 100)
        : Number(size.width);

    const height = typeof size.height === 'string' && size.height.includes('%')
        ? screenHeight * (parseInt(size.height) / 100)
        : Number(size.height);

    // Position apps in the center of the screen
    return {
        x: (screenWidth - width) / 2,
        y: (screenHeight - height) / 2
    };
};

// Helper function to open an app
export const createAppWindow = (appId: string) => {
    // Try to match directly
    let app = appRegistry[appId];

    // If not found, try to match through path
    if (!app) {
        // Remove leading slash and match in appRegistry
        const pathToMatch = appId.startsWith('/') ? appId : `/${appId}`;
        app = Object.values(appRegistry).find(a => a.path === pathToMatch);
    }

    if (!app) return null;

    // Convert percentage size to actual pixels
    const screenWidth = globalThis.window?.innerWidth || 1200;
    const screenHeight = globalThis.window?.innerHeight || 800;

    const size = {
        width: typeof app.defaultSize.width === 'string' && app.defaultSize.width.includes('%')
            ? screenWidth * (parseInt(app.defaultSize.width) / 100)
            : Number(app.defaultSize.width),
        height: typeof app.defaultSize.height === 'string' && app.defaultSize.height.includes('%')
            ? screenHeight * (parseInt(app.defaultSize.height) / 100)
            : Number(app.defaultSize.height)
    };

    return {
        id: uuidv4(),
        title: app.title,
        content: app.component,
        path: app.path,
        position: app.defaultPosition || getDefaultAppPosition(app.defaultSize),
        size
    };
}; 