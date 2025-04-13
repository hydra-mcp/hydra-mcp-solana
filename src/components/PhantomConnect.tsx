import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type PhantomConnectProps = {
    setWalletAddress: (address: string) => void;
};

const PhantomConnect = ({ setWalletAddress }: PhantomConnectProps) => {
    const [walletAddress, setWalletAddressState] = useState('');
    const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

    // Check if Phantom wallet is installed
    useEffect(() => {
        const checkForPhantom = async () => {
            const provider = window.phantom?.solana;
            setIsPhantomInstalled(provider !== undefined);
        };
        checkForPhantom();
    }, []);

    // Connect wallet function
    const connectWallet = async () => {
        try {
            const provider = window.phantom?.solana;
            if (provider) {
                const response = await provider.connect();
                const publicKey = response.publicKey.toString();
                setWalletAddressState(publicKey);
                setWalletAddress(publicKey);
                toast.success('Wallet connected successfully!');
            } else {
                toast.error('Phantom wallet not installed!');
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            toast.error('Failed to connect wallet');
        }
    };

    // Disconnect wallet
    const disconnectWallet = async () => {
        try {
            const provider = window.phantom?.solana;
            if (provider) {
                await provider.disconnect();
                setWalletAddressState('');
                setWalletAddress('');
                toast.info('Wallet disconnected');
            }
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    };

    return (
        <div className="rounded-lg border p-4 shadow-sm">
            {!isPhantomInstalled ? (
                <div className="space-y-2">
                    <p>Phantom wallet is not installed. Please install the Phantom wallet extension first.</p>
                    <a
                        href="https://phantom.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        Install Phantom
                    </a>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                    {walletAddress ? (
                        <>
                            <p className="text-sm">
                                Connected to wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                            </p>
                            <button
                                className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90"
                                onClick={disconnectWallet}
                            >
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <button
                            className="inline-flex h-9 w-full sm:w-auto items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            onClick={connectWallet}
                        >
                            Connect Phantom Wallet
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PhantomConnect; 