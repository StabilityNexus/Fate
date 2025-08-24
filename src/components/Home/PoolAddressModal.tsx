"use client";
import React from 'react';

interface PoolAddressModalProps {
  vaultAddress: string;
  setVaultAddress: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const PoolAddressModal: React.FC<PoolAddressModalProps> = ({
  vaultAddress,
  setVaultAddress,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Enter Pool Address</h2>
        <input
          type="text"
          value={vaultAddress}
          onChange={(e) => setVaultAddress(e.target.value)}
          className="w-full p-2 border border-neutral-300 rounded mb-4 dark:bg-neutral-700 dark:text-white"
          placeholder="0x123...abc"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-300 dark:bg-neutral-600 text-black dark:text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoolAddressModal;