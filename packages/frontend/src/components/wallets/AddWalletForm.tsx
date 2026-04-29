"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AddWalletFormProps {
  onAdd: (address: string, label?: string) => Promise<void>;
  disabled?: boolean;
}

function isValidSS58(address: string): boolean {
  // Basic SS58 validation: starts with typical chars, 47-48 chars long
  return /^[1-9A-HJ-NP-Za-km-z]{47,49}$/.test(address);
}

export function AddWalletForm({ onAdd, disabled }: AddWalletFormProps) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addressValid = isValidSS58(address);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addressValid) {
      setError("Please enter a valid SS58 address");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd(address.trim(), label.trim() || undefined);
      setAddress("");
      setLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add wallet");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">
          Wallet Address <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError(null); }}
          placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
          className={cn(
            "w-full rounded-lg border bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1",
            address && !addressValid
              ? "border-red-600 focus:ring-red-600"
              : "border-gray-700 focus:ring-pink-500",
          )}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-400">
          Label <span className="text-gray-600">(optional)</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. My staking wallet"
          maxLength={80}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
        />
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={disabled || isSubmitting || !address}
        className="w-full"
      >
        {isSubmitting ? "Adding…" : "Add Wallet"}
      </Button>
    </form>
  );
}
