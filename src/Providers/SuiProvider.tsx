"use client";

import { WalletProvider } from "@suiet/wallet-kit";

export function ProviderSui({ children }: { children: React.ReactNode }) {
    return (
        <WalletProvider>
            <div>
                {children}
            </div>
        </WalletProvider>
    );
}