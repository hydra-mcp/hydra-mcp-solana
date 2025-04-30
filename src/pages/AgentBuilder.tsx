import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { Bot, Sliders, Plus, Save, Server, AlertTriangle, CheckCircle, Loader2, Check, X, Settings } from 'lucide-react';
import AgentFormComponent from '@/components/AgentBuilder/AgentFormComponent';
import ServerSelectorComponent from '@/components/AgentBuilder/ServerSelectorComponent';
import { AgentCreationData, createAgent, AppCategory, fetchAppCategories } from '@/lib/appStoreService';
import { motion } from 'framer-motion';
import { useAppWindow } from '@/contexts/AppWindowContext';

export function AgentBuilder() {
    const { isDarkMode } = useTheme();
    const { closeApp, getAppByPath } = useAppWindow();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [logo, setLogo] = useState<string | null>(null);
    const [category, setCategory] = useState('');
    const [website, setWebsite] = useState('');
    const [suggested_questions, setSuggestedQuestions] = useState<string[]>([]);
    const [selectedServers, setSelectedServers] = useState<string[]>([]);

    // UI state
    const [showServerSelector, setShowServerSelector] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<AppCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Fetch categories once when component mounts
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true);
                const data = await fetchAppCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to load categories:', error);
                setError('Failed to load categories. Please try again.');
            } finally {
                setLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'Agent name is required';
        }

        if (!category) {
            newErrors.category = 'Category is required';
        }

        if (selectedServers.length === 0) {
            newErrors.servers = 'At least one server must be selected';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateAgent = async () => {
        if (!validateForm()) {
            return;
        }

        setCreating(true);
        setError(null);

        try {
            const agentData: AgentCreationData = {
                name,
                description: description.trim() || undefined,
                logo: logo || undefined,
                category,
                servers: selectedServers,
                suggested_questions: suggested_questions.length > 0 ? suggested_questions : undefined,
                website: website.trim() || undefined
            };

            const result = await createAgent(agentData);

            if (result.success) {
                setSuccess(true);
                // Close the current window after a brief delay to show success message
                setTimeout(() => {
                    const currentWindow = getAppByPath('/agent-builder');
                    if (currentWindow) {
                        closeApp(currentWindow.id);
                    }
                }, 2000);
            } else {
                setError(result.message || 'Failed to create agent');
            }
        } catch (err) {
            console.error('Error creating agent:', err);
            setError('Failed to create agent. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    // Toggle the server selector
    const toggleServerSelector = () => {
        setShowServerSelector(!showServerSelector);
    };

    const cancelServerSelection = () => {
        setShowServerSelector(false);
    };

    return (
        <div className={cn(
            "h-full flex flex-col",
            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        )}>
            <div className="border-b px-4 py-3 flex items-center justify-between dark:border-gray-700">
                <h1 className="text-lg font-semibold">Agent Builder</h1>
                <Bot className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>

            {/* Success Message */}
            {success && (
                <div className={cn(
                    "m-4 p-4 rounded-lg border flex items-center",
                    isDarkMode
                        ? "bg-green-900/20 border-green-800 text-green-200"
                        : "bg-green-50 border-green-200 text-green-600"
                )}>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Agent created successfully! Redirecting...</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className={cn(
                    "m-4 p-4 rounded-lg border flex items-center",
                    isDarkMode
                        ? "bg-red-900/20 border-red-800 text-red-200"
                        : "bg-red-50 border-red-200 text-red-600"
                )}>
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading Categories Message */}
            {loadingCategories && !showServerSelector && (
                <div className={cn(
                    "m-4 p-4 rounded-lg border flex items-center",
                    isDarkMode
                        ? "bg-blue-900/20 border-blue-800 text-blue-200"
                        : "bg-blue-50 border-blue-200 text-blue-600"
                )}>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span>Loading categories...</span>
                </div>
            )}

            <div className="flex-1 overflow-hidden flex">
                {/* Main Form or Server Selector */}
                <div className="flex-1 overflow-auto">
                    {showServerSelector ? (
                        <ServerSelectorComponent
                            selectedServers={selectedServers}
                            onServerSelect={setSelectedServers}
                        />
                    ) : (
                        <AgentFormComponent
                            name={name}
                            setName={setName}
                            description={description}
                            setDescription={setDescription}
                            logo={logo}
                            setLogo={setLogo}
                            category={category}
                            setCategory={setCategory}
                            website={website}
                            setWebsite={setWebsite}
                            suggested_questions={suggested_questions}
                            setSuggestedQuestions={setSuggestedQuestions}
                            errors={errors}
                            categories={categories}
                            isLoading={loadingCategories}
                        />
                    )}
                </div>
            </div>

            {/* Server Selection Status - Enhanced UI */}
            {!showServerSelector && (
                <div className={cn(
                    "mx-4 my-3 p-3 rounded-lg border shadow-sm flex items-center justify-between",
                    isDarkMode
                        ? selectedServers.length > 0
                            ? "bg-blue-900/10 border-blue-800/30"
                            : "bg-gray-800 border-gray-700"
                        : selectedServers.length > 0
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                )}>
                    <div className="flex items-center">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                            isDarkMode
                                ? selectedServers.length > 0
                                    ? "bg-blue-900/20 text-blue-400"
                                    : "bg-gray-700 text-gray-400"
                                : selectedServers.length > 0
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-200 text-gray-500"
                        )}>
                            <Server className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-medium">
                                {selectedServers.length === 0
                                    ? "No servers selected"
                                    : <span className="flex items-center">
                                        <span className={cn(
                                            "text-lg mr-2",
                                            isDarkMode
                                                ? "text-blue-400"
                                                : "text-blue-600"
                                        )}>
                                            {selectedServers.length}
                                        </span>
                                        <span>
                                            server{selectedServers.length > 1 ? 's' : ''} selected
                                        </span>
                                    </span>
                                }
                            </div>
                            {errors.servers && (
                                <p className="text-red-500 text-sm flex items-center mt-1">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                    {errors.servers}
                                </p>
                            )}
                            {selectedServers.length === 0 && !errors.servers && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Select at least one server to create an agent
                                </p>
                            )}
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={toggleServerSelector}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            isDarkMode
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                                : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md"
                        )}
                    >
                        {selectedServers.length === 0 ? (
                            <>
                                <Plus className="w-4 h-4" />
                                Add Servers
                            </>
                        ) : (
                            <>
                                <Settings className="w-4 h-4" />
                                Change Servers
                            </>
                        )}
                    </motion.button>
                </div>
            )}

            {/* Bottom Action Bar */}
            <div className={cn(
                "px-4 py-3 flex items-center justify-end gap-3 border-t",
                isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
                {showServerSelector && (
                    <>
                        <button
                            onClick={cancelServerSelection}
                            className={cn(
                                "px-4 py-2 rounded-md transition-all flex items-center",
                                isDarkMode
                                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                            )}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </button>
                        <button
                            onClick={toggleServerSelector}
                            disabled={selectedServers.length === 0}
                            className={cn(
                                "px-4 py-2 rounded-md transition-all flex items-center",
                                isDarkMode
                                    ? selectedServers.length === 0
                                        ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-70"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                                    : selectedServers.length === 0
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70"
                                        : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md"
                            )}
                        >
                            {selectedServers.length === 0 ? (
                                <>
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Select Servers First
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Save Agent Servers
                                </>
                            )}
                        </button>
                    </>
                )}

                {!showServerSelector && (
                    <button
                        onClick={handleCreateAgent}
                        disabled={creating || selectedServers.length === 0}
                        className={cn(
                            "px-4 py-2 rounded-md flex items-center transition-all",
                            isDarkMode
                                ? creating || selectedServers.length === 0
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-70"
                                    : "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
                                : creating || selectedServers.length === 0
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70"
                                    : "bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md"
                        )}
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : selectedServers.length === 0 ? (
                            <>
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                Need Servers
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Create Agent
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
} 