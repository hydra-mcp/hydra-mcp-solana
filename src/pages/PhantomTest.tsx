import { TokenBalanceExample } from '@/components/phantom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const PhantomTest = () => {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Phantom Wallet Test Page</h1>
            <ErrorBoundary fallback={
                <div className="p-4 border border-red-500 rounded bg-red-50">
                    <h2 className="text-lg font-bold text-red-700 mb-2">Error loading Phantom wallet</h2>
                    <p className="text-red-600">
                        It may be because the browser has not installed the Phantom wallet extension, or there is a problem with the network connection.
                        Please ensure that the Phantom wallet extension is installed and try refreshing the page.
                    </p>
                    <a
                        href="https://phantom.app/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                        Download Phantom Wallet
                    </a>
                </div>
            }>
                <TokenBalanceExample />
            </ErrorBoundary>
        </div>
    );
};

export default PhantomTest; 