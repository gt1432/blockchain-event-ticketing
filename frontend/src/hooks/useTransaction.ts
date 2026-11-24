import { useState, useCallback } from "react";
import { TransactionState } from "../types";

export function useTransaction() {
  const [txState, setTxState] = useState<TransactionState>({
    hash: null,
    status: "idle",
    error: null,
    description: "",
  });

  const execute = useCallback(
    async (fn: () => Promise<any>, description = "Processing transaction...") => {
      setTxState({ hash: null, status: "pending", error: null, description });
      try {
        const tx = await fn();
        setTxState({ hash: tx.hash, status: "pending", error: null, description: "Confirming block inclusion on blockchain..." });
        const receipt = await tx.wait();
        setTxState({ hash: receipt.hash || tx.hash, status: "success", error: null, description: "Transaction confirmed successfully!" });
        return receipt;
      } catch (err: any) {
        console.error("Transaction failed:", err);
        const reason =
          err?.reason ||
          err?.data?.message ||
          err?.shortMessage ||
          err?.info?.error?.message ||
          err?.message ||
          "Transaction was rejected or reverted.";
        setTxState({ hash: null, status: "error", error: reason, description: "Failed" });
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setTxState({ hash: null, status: "idle", error: null, description: "" });
  }, []);

  return { txState, execute, reset };
}