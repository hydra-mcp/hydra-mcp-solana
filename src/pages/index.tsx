import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tablet } from 'lucide-react';

export default function Home() {
    return (
        <div className="container mx-auto py-16 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-3">Hydra Virtual Assistant Demo</h1>
                    <p className="text-xl text-gray-600">Experience AI-powered virtual human interactions</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-6 flex flex-col h-full">
                        <h2 className="text-2xl font-semibold mb-2">Voice Call</h2>
                        <p className="text-gray-600 mb-4 flex-grow">
                            Experience voice call interactions with virtual assistants featuring multiple personas and customizable voice parameters.
                        </p>
                        <div className="mt-auto">
                            <Link to="/voice">
                                <Button className="w-full">Start Experience</Button>
                            </Link>
                        </div>
                    </Card>

                    <Card className="p-6 flex flex-col h-full">
                        <h2 className="text-2xl font-semibold mb-2">Customization Demo</h2>
                        <p className="text-gray-600 mb-4 flex-grow">
                            Explore multiple assistant configurations, customize voice parameters, and learn about advanced features and options.
                        </p>
                        <div className="mt-auto">
                            <Link to="/voice-demo">
                                <Button className="w-full" variant="outline">View Demo</Button>
                            </Link>
                        </div>
                    </Card>

                    <Card className="p-6 flex flex-col h-full border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                        <div className="flex items-center mb-2">
                            <Tablet className="w-6 h-6 text-blue-500 mr-2" />
                            <h2 className="text-2xl font-semibold">iOS Experience</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                            Experience high-fidelity iOS system interfaces, including animation interactions, desktop applications, and professional blockchain AI wallet analysis tools.
                        </p>
                        <div className="mt-auto">
                            <Link to="/ios-desktop">
                                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                                    Enter iOS Experience
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-sm text-gray-500">
                        Hydra Virtual Human System - The Future of Human-Machine Interaction
                    </p>
                </div>
            </div>
        </div>
    );
} 