"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { enableExtension, getWalletDisplayName } from "@/lib/wallet";
import type { InjectedAccount } from "@/lib/wallet";

interface WalletSelectorProps {
  onClose: () => void;
}

type Step = "pickExtension" | "pickAccount" | "signing";

export function WalletSelector({ onClose }: WalletSelectorProps) {
  const { availableWallets, login } = useAuthContext();
  const [step, setStep] = useState<Step>("pickExtension");
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleExtensionSelect(key: string) {
    setError(null);
    setSelectedExtension(key);
    try {
      const ext = await enableExtension(key);
      const accs = await ext.accounts.get();
      if (accs.length === 0) {
        setError("No accounts found in this wallet. Please create an account first.");
        return;
      }
      setAccounts(accs);
      setStep("pickAccount");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  }

  async function handleAccountSelect(address: string) {
    if (!selectedExtension) return;
    setStep("signing");
    setError(null);
    try {
      await login(selectedExtension, address);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setStep("pickAccount");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-300"
          aria-label="Close"
        >
          ✕
        </button>

        {step === "pickExtension" && (
          <>
            <h2 className="mb-1 text-lg font-semibold">Connect Wallet</h2>
            <p className="mb-4 text-sm text-gray-400">
              Choose your Polkadot wallet extension
            </p>

            {availableWallets.length === 0 ? (
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm text-gray-400">
                <p className="mb-2 font-medium text-gray-300">No wallet detected</p>
                <p className="mb-3">Install a Polkadot wallet extension to continue:</p>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://talisman.xyz"
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-400 hover:underline"
                    >
                      Talisman
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://subwallet.app"
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-400 hover:underline"
                    >
                      SubWallet
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://polkadot.js.org/extension/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-400 hover:underline"
                    >
                      Polkadot.js
                    </a>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                {availableWallets.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleExtensionSelect(key)}
                    className="flex w-full items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-left transition-colors hover:border-gray-500 hover:bg-gray-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-sm font-bold uppercase text-gray-200">
                      {getWalletDisplayName(key).charAt(0)}
                    </span>
                    <span className="font-medium text-gray-100">
                      {getWalletDisplayName(key)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === "pickAccount" && (
          <>
            <h2 className="mb-1 text-lg font-semibold">Select Account</h2>
            <p className="mb-4 text-sm text-gray-400">
              Choose an account from {selectedExtension ? getWalletDisplayName(selectedExtension) : "your wallet"}
            </p>
            <div className="space-y-2">
              {accounts.map((acc) => (
                <button
                  key={acc.address}
                  onClick={() => handleAccountSelect(acc.address)}
                  className="flex w-full flex-col gap-0.5 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-left transition-colors hover:border-gray-500 hover:bg-gray-700"
                >
                  {acc.name && (
                    <span className="text-sm font-medium text-gray-100">{acc.name}</span>
                  )}
                  <span className="font-mono text-xs text-gray-400">
                    {acc.address.slice(0, 8)}…{acc.address.slice(-6)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "signing" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-pink-500" />
            <p className="text-sm text-gray-400">
              Sign the message in your wallet…
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
