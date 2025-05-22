'use client'

import { useState } from 'react';
import { Coins } from 'lucide-react'
import { Transaction } from '@mysten/sui/transactions'
import { useWallet } from "@suiet/wallet-kit";

interface Token {
    id: string
    name: string
    symbol: string
    balance: number
    price: number
    vault_creator: string
    vault_fee: number
    vault_creator_fee: number
    treasury_fee: number
    asset_balance: number
    supply: number
    prediction_pool: string
    other_token: string
}

interface Vault {
    id: string
    bullToken: Token
    bearToken: Token
    bullPercentage: number
    bearPercentage: number
    totalValue: number
    previous_price: number
    vault_creator: string
    fees: {
        entry: number
        exit: number
        performance: number
    }
}

interface DualTokenVaultProps {
    tokens: {
        bullToken: Token
        bearToken: Token
    }
    vault: Vault
}

export default function DualTokenVault({ tokens, vault }: DualTokenVaultProps) {
    const [buyAmount, setBuyAmount] = useState<number>();
    const [sellAmount, setSellAmount] = useState<number>();
    const bullValue = tokens.bullToken.price * tokens.bullToken.balance
    const bearValue = tokens.bearToken.price * tokens.bearToken.balance
    const totalValue = bullValue + bearValue

    const { account, signAndExecuteTransaction } = useWallet();
    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
    const DENOMINATOR = 100_000;

    const handleBuy = async (tokenId: string, amount: number) => {
        if (!amount || amount <= 0) {
            alert("Please enter a valid deposit amount");
            return;
        }

        if (!account?.address) {
            alert("Please connect your wallet");
            return;
        }

        if (!PACKAGE_ID) {
            alert("Missing PACKAGE_ID in env");
            return;
        }

        try {
            const tx = new Transaction();
            const amountInMist = BigInt(amount * 1_000_000_000); // Convert SUI to Mist (1 SUI = 10^9 Mist)

            const coin = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

            tx.moveCall({
                target: `${PACKAGE_ID}::token::buy`,
                arguments: [
                    tx.object(tokenId),
                    coin,
                    tx.pure.address(account.address),
                    tx.pure.u64(amountInMist),
                ],
            });

            tx.setGasBudget(11_000_000);

            const result = await signAndExecuteTransaction({
                transaction: tx,
            });

            console.log("Buy success:", result);
            alert("Deposit successful!");
        } catch (error: any) {
            console.error("Buy failed:", error);
            alert(`Deposit failed: ${error.message || error}`);
        }
    };

    const handleSell = async (tokenId: string, amount: number) => {
        if (!amount || amount <= 0) {
            alert("Please enter a valid withdraw amount");
            return;
        }

        if (!account?.address) {
            alert("Please connect your wallet");
            return;
        }

        if (!PACKAGE_ID) {
            alert("Missing PACKAGE_ID in env");
            return;
        }

        try {
            const tx = new Transaction();

            const amountInTokenUnits = BigInt(amount * DENOMINATOR); // Your token unit

            tx.moveCall({
                target: `${PACKAGE_ID}::token::sell`,
                arguments: [
                    tx.object(tokenId),
                    tx.pure.u64(amountInTokenUnits),
                ],
                typeArguments: ["0x2::sui::SUI"],
            });

            tx.setGasBudget(11_000_000);

            const result = await signAndExecuteTransaction({
                transaction: tx,
            });

            console.log("Sell success:", result);
            alert("Withdraw successful!");
        } catch (error: any) {
            console.error("Sell failed:", error);
            alert(`Withdraw failed: ${error.message || error}`);
        }
    };


    return (
        <div className="w-full pt-14 bg-white dark:bg-black">
            <div className="w-full md:px-24 lg:px-24">
                <div className="container mx-auto px-8 py-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        <Coins className="h-8 w-8 text-black dark:text-white" />
                        <h1 className="text-3xl font-bold text-black dark:text-white">
                            {tokens.bullToken.name} / {tokens.bearToken.name} Vault
                        </h1>
                    </div>

                    <div className="flex space-x-4">
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-5 py-3 text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                                {tokens.bullToken.name} Balance
                            </div>
                            <div className="font-mono text-lg text-black dark:text-white">
                                {tokens.bullToken.balance.toFixed(2)} {tokens.bullToken.symbol}
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    ${(tokens.bullToken.price * tokens.bullToken.balance).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-5 py-3 text-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                                {tokens.bearToken.name} Balance
                            </div>
                            <div className="font-mono text-lg text-black dark:text-white">
                                {tokens.bearToken.balance.toFixed(2)} {tokens.bearToken.symbol}
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    ${(tokens.bearToken.price * tokens.bearToken.balance).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-8 py-6 space-y-8">
                    <section className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Vault Overview</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Market Position</h3>
                                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-black dark:bg-white" style={{ width: `${vault.bullPercentage}%` }}></div>
                                </div>
                                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span>{vault.bullPercentage.toFixed(2)}% Bull</span>
                                    <span>{vault.bearPercentage.toFixed(2)}% Bear</span>
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Total Value</h3>
                                <p className="text-2xl font-mono text-black dark:text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Previous Price: ${vault.previous_price.toFixed(4)}
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Token Prices</h3>
                                <div className="space-y-2">
                                    <p className="text-black dark:text-white">
                                        {tokens.bullToken.symbol}: ${tokens.bullToken.price.toFixed(4)}
                                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                            Supply: {tokens.bullToken.supply.toLocaleString()}
                                        </span>
                                    </p>
                                    <p className="text-black dark:text-white">
                                        {tokens.bearToken.symbol}: ${tokens.bearToken.price.toFixed(4)}
                                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                            Supply: {tokens.bearToken.supply.toLocaleString()}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Deposit</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</label>
                                        <input type="number" value={buyAmount} onChange={(e) => setBuyAmount(Number(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-black dark:text-white dark:bg-gray-900" placeholder="0.00" />
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => buyAmount !== undefined && handleBuy(tokens.bullToken.id, buyAmount)}
                                            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200">
                                            Deposit Bull
                                        </button>
                                        <button
                                            onClick={() => buyAmount !== undefined && handleBuy(tokens.bullToken.id, buyAmount)}
                                            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200">
                                            Deposit Bear
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Withdraw</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</label>
                                        <input type="number" onChange={(e) => setSellAmount(Number(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-black dark:text-white dark:bg-gray-900" placeholder="0.00" />
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => sellAmount !== undefined && handleSell(tokens.bullToken.id, sellAmount)}
                                            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200">
                                            Withdraw Bull
                                        </button>
                                        <button
                                            onClick={() => sellAmount !== undefined && handleSell(tokens.bearToken.id, sellAmount)}
                                            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200">
                                            Withdraw Bear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Vault Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Fees</h3>
                                <div className="space-y-2 text-black dark:text-white">
                                    <p>Entry: {vault.fees.entry}%</p>
                                    <p>Exit: {vault.fees.exit}%</p>
                                    <p>Performance: {vault.fees.performance}%</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Treasury Fee: {tokens.bullToken.treasury_fee / 100}%
                                    </p>
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Token Info</h3>
                                <div className="space-y-2 text-black dark:text-white">
                                    <p><span className="font-medium">Bull Token ID:</span><span className="text-sm font-mono block truncate">{tokens.bullToken.id}</span></p>
                                    <p><span className="font-medium">Bear Token ID:</span><span className="text-sm font-mono block truncate">{tokens.bearToken.id}</span></p>
                                    <p><span className="font-medium">Vault Creator:</span><span className="text-sm font-mono block truncate">{vault.vault_creator}</span></p>
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">About This Vault</h3>
                                <p className="text-black dark:text-white">
                                    This dual-token vault allows you to take positions on market direction. Bull tokens increase in value when the market rises, while Bear tokens increase when the market falls. The vault automatically rebalances based on price movements.
                                </p>
                                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <p>Prediction Pool: {tokens.bullToken.prediction_pool}</p>
                                    <p>Asset Balance: ${tokens.bullToken.asset_balance.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}