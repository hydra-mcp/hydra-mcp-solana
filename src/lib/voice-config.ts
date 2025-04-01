/**
 *  Voice assistant configuration file
 */

// Virtual assistant configuration interface
export interface VirtualAssistantConfig {
    name: string;           // Virtual assistant name
    avatar: string;         // Virtual assistant avatar URL
    role?: string;          // Virtual assistant role
    description?: string;   // Virtual assistant description
}

// Voice configuration interface
export interface VoiceConfig {
    voice_id?: string;      // Voice ID
    speed?: number;         // Voice speed (0.5-2.0)
    volume?: number;        // Volume (0.1-1.0)
    format?: string;        // Audio format (mp3, wav, ogg)
    model_role?: string;    // Model role
}

// Import the image properly
import yangmi from "../assets/images/yangmi.jpg";
import trump from "../assets/images/trump.png";
import anne from "../assets/images/anne.png";

// Default virtual assistant configuration list
export const VIRTUAL_ASSISTANTS: Record<string, VirtualAssistantConfig> = {
    "yangmi": {
        name: "Yang Mi",
        avatar: yangmi,
        role: "Chinese actress",
        description: "Chinese actress, your virtual AI girlfriend"
    },
    "trump": {
        name: "Trump",
        avatar: trump,
        role: "President of the United States",
        description: "Former President of the United States, current President of the United States"
    },
    "anne": {
        name: "Anne Hathaway",
        avatar: anne,
        role: "American actress",
        description: "American actress, your virtual AI girlfriend"
    }
};

// Default virtual assistant
export const DEFAULT_ASSISTANT_ID = "yangmi";

// Default voice configuration
export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
    voice_id: "",
    speed: 1.0,
    volume: 1.0,
    format: "mp3",
    model_role: "assistant"
}; 