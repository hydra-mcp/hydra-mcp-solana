import React, { useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import {
    Bot, X, Plus, Upload, Trash2, ExternalLink, LinkIcon, AlertCircle, FileText, Tag, Globe, Check
} from 'lucide-react';
import { AppCategory } from '@/lib/appStoreService';
import { motion } from 'framer-motion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from '@/components/ui/select';

interface AgentFormComponentProps {
    name: string;
    setName: (name: string) => void;
    description: string;
    setDescription: (description: string) => void;
    logo: string | null;
    setLogo: (logo: string | null) => void;
    category: string;
    setCategory: (category: string) => void;
    website: string;
    setWebsite: (website: string) => void;
    suggested_questions: string[];
    setSuggestedQuestions: (questions: string[]) => void;
    errors: Record<string, string>;
    categories: AppCategory[];
    isLoading: boolean;
}

const AgentFormComponent: React.FC<AgentFormComponentProps> = ({
    name,
    setName,
    description,
    setDescription,
    logo,
    setLogo,
    category,
    setCategory,
    website,
    setWebsite,
    suggested_questions,
    setSuggestedQuestions,
    errors,
    categories,
    isLoading
}) => {
    const { isDarkMode } = useTheme();
    const [newQuestion, setNewQuestion] = useState<string>('');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogo(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setLogo(null);
    };

    const addSuggestedQuestion = () => {
        if (newQuestion.trim() && suggested_questions.length < 4) {
            setSuggestedQuestions([...suggested_questions, newQuestion.trim()]);
            setNewQuestion('');
        }
    };

    const removeSuggestedQuestion = (index: number) => {
        setSuggestedQuestions(suggested_questions.filter((_, i) => i !== index));
    };

    return (
        <div className={cn(
            "flex flex-col space-y-6 p-4",
            isDarkMode ? "text-white" : "text-gray-900"
        )}>
            {/* Agent Name */}
            <div className={cn(
                "p-4 rounded-lg border shadow-sm",
                isDarkMode
                    ? errors.name
                        ? "bg-red-900/10 border-red-800/30"
                        : "bg-gray-800/80 border-gray-700"
                    : errors.name
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-200"
            )}>
                <div className="flex items-start mb-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                        isDarkMode
                            ? "bg-blue-900/20 text-blue-400"
                            : "bg-blue-100 text-blue-600"
                    )}>
                        <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium">
                            Agent Name <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Create a descriptive name for your agent
                        </p>
                    </div>
                </div>
                <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                        "w-full px-3 py-2 border rounded-md transition-all",
                        isDarkMode
                            ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                        errors.name ? "border-red-500 ring-1 ring-red-500" : ""
                    )}
                    placeholder="My Custom Agent"
                />
                {errors.name && (
                    <p className="text-red-500 text-sm flex items-center mt-2">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.name}
                    </p>
                )}
            </div>

            {/* Description */}
            <div className={cn(
                "p-4 rounded-lg border shadow-sm",
                isDarkMode
                    ? "bg-gray-800/80 border-gray-700"
                    : "bg-gray-50 border-gray-200"
            )}>
                <div className="flex items-start mb-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                        isDarkMode
                            ? "bg-purple-900/20 text-purple-400"
                            : "bg-purple-100 text-purple-600"
                    )}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium">
                            Description
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Provide a brief description of what your agent does
                        </p>
                    </div>
                </div>
                <motion.textarea
                    whileFocus={{ scale: 1.01 }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={cn(
                        "w-full px-3 py-2 border rounded-md transition-all",
                        isDarkMode
                            ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    )}
                    placeholder="This agent helps with..."
                />
            </div>

            {/* Logo Upload */}
            <div className={cn(
                "p-4 rounded-lg border shadow-sm",
                isDarkMode
                    ? "bg-gray-800/80 border-gray-700"
                    : "bg-gray-50 border-gray-200"
            )}>
                <div className="flex items-start mb-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                        isDarkMode
                            ? "bg-green-900/20 text-green-400"
                            : "bg-green-100 text-green-600"
                    )}>
                        <Upload className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium">
                            Logo
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Upload a custom logo for your agent
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {logo ? (
                        <div className="relative">
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={logo}
                                alt="Logo"
                                className="w-24 h-24 rounded-lg object-cover shadow-md"
                            />
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={removeLogo}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                                title="Remove Logo"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>
                    ) : (
                        <div className={cn(
                            "w-24 h-24 rounded-lg flex items-center justify-center border-2 border-dashed",
                            isDarkMode ? "border-gray-700" : "border-gray-300"
                        )}>
                            <Bot className="w-10 h-10 text-gray-500" />
                        </div>
                    )}
                    <motion.label
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                            "px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm flex items-center space-x-2",
                            isDarkMode
                                ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-md"
                                : "bg-green-500 hover:bg-green-600 text-white hover:shadow-md"
                        )}
                    >
                        <Upload className="w-4 h-4" />
                        <span>{logo ? "Change Logo" : "Upload Logo"}</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                    </motion.label>
                </div>
            </div>

            {/* Category - Enhanced with UI Select */}
            <div className={cn(
                "p-4 rounded-lg border shadow-sm",
                isDarkMode
                    ? errors.category
                        ? "bg-red-900/10 border-red-800/30"
                        : "bg-gray-800/80 border-gray-700"
                    : errors.category
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-200"
            )}>
                <div className="flex items-start mb-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                        isDarkMode
                            ? "bg-yellow-900/20 text-yellow-400"
                            : "bg-yellow-100 text-yellow-600"
                    )}>
                        <Tag className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Select a category for your agent
                        </p>
                    </div>
                </div>

                <Select
                    value={category}
                    onValueChange={setCategory}
                    disabled={isLoading}
                >
                    <SelectTrigger
                        className={cn(
                            "w-full transition-all focus:scale-[1.01]",
                            isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-yellow-500 focus:ring-yellow-500"
                                : "bg-white border-gray-300 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500",
                            errors.category ? "border-red-500 ring-1 ring-red-500" : "",
                            isLoading ? "opacity-70 cursor-not-allowed" : ""
                        )}
                    >
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent
                        className={cn(
                            isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white"
                                : "bg-white border-gray-200 text-gray-900"
                        )}
                    >
                        <SelectGroup>
                            <SelectLabel
                                className={cn(
                                    isDarkMode ? "text-gray-300" : "text-gray-700"
                                )}
                            >
                                Categories
                            </SelectLabel>
                            {categories.map((cat) => (
                                <SelectItem
                                    key={cat.id}
                                    value={cat.id}
                                    className={cn(
                                        isDarkMode
                                            ? "focus:bg-gray-700 data-[state=checked]:bg-yellow-900/30"
                                            : "focus:bg-gray-100 data-[state=checked]:bg-yellow-50"
                                    )}
                                >
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {errors.category && (
                    <p className="text-red-500 text-sm flex items-center mt-2">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.category}
                    </p>
                )}
            </div>

            {/* Website */}
            <div className={cn(
                "p-4 rounded-lg border shadow-sm",
                isDarkMode
                    ? "bg-gray-800/80 border-gray-700"
                    : "bg-gray-50 border-gray-200"
            )}>
                <div className="flex items-start mb-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                        isDarkMode
                            ? "bg-indigo-900/20 text-indigo-400"
                            : "bg-indigo-100 text-indigo-600"
                    )}>
                        <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium">
                            Website
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add a website URL for your agent
                        </p>
                    </div>
                </div>
                <div className="relative">
                    <LinkIcon className="absolute top-2.5 left-3 w-5 h-5 text-gray-500" />
                    <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className={cn(
                            "w-full px-3 py-2 pl-10 border rounded-md transition-all",
                            isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                : "bg-white border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        )}
                        placeholder="https://example.com"
                    />
                </div>
            </div>

            {/* Suggested Questions */}
            <div className={cn(
                "p-4 rounded-lg border shadow-sm",
                isDarkMode
                    ? "bg-gray-800/80 border-gray-700"
                    : "bg-gray-50 border-gray-200"
            )}>
                <div className="flex items-start mb-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                        isDarkMode
                            ? "bg-pink-900/20 text-pink-400"
                            : "bg-pink-100 text-pink-600"
                    )}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium">
                            Suggested Questions (Max 4)
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add questions users can ask your agent
                        </p>
                    </div>
                </div>

                <div className="space-y-3 mb-3">
                    {suggested_questions.map((question, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={index}
                            className={cn(
                                "flex items-center p-3 rounded-md shadow-sm",
                                isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"
                            )}
                        >
                            <span className="flex-1">{question}</span>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeSuggestedQuestion(index)}
                                className={cn(
                                    "p-1 rounded-full",
                                    isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-500 hover:bg-red-100"
                                )}
                            >
                                <Trash2 className="w-4 h-4" />
                            </motion.button>
                        </motion.div>
                    ))}
                </div>

                {suggested_questions.length < 4 && (
                    <div className="flex space-x-2">
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            type="text"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            className={cn(
                                "flex-1 px-3 py-2 border rounded-md transition-all",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                    : "bg-white border-gray-300 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                            )}
                            placeholder="Add a suggested question"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSuggestedQuestion();
                                }
                            }}
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={addSuggestedQuestion}
                            disabled={!newQuestion.trim() || suggested_questions.length >= 4}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                isDarkMode
                                    ? newQuestion.trim() && suggested_questions.length < 4
                                        ? "bg-pink-600 hover:bg-pink-700 text-white shadow-sm"
                                        : "bg-gray-700 text-gray-500 cursor-not-allowed opacity-70"
                                    : newQuestion.trim() && suggested_questions.length < 4
                                        ? "bg-pink-500 hover:bg-pink-600 text-white shadow-sm"
                                        : "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
                            )}
                        >
                            <Plus className="w-5 h-5" />
                        </motion.button>
                    </div>
                )}

                {suggested_questions.length >= 4 && (
                    <p className="text-sm text-yellow-500 dark:text-yellow-400 flex items-center mt-2">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Maximum number of suggested questions reached
                    </p>
                )}
            </div>
        </div>
    );
};

export default AgentFormComponent; 