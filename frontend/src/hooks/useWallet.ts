import { useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers";
import { WalletState } from "../types";
import { SUPPORTED_NETWORKS, checkUserRoles } from "../services/web3Service";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    isAdmin: false,
    isOrganizer: false,
    isVerifier: false,
  });

  const syncState = useCallback(async (accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      setWallet({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
        isAdmin: false,
        isOrganizer: false,
        isVerifier: false,
      });
      return;
    }

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const address = accounts[0];

      const roles = await checkUserRoles(address);
      const isSupported = Object.keys(SUPPORTED_NETWORKS).includes(chainId.toString());

      setWallet({
        address,
        chainId,
        isConnected: true,
        isConnecting: false,
        error: isSupported ? null : "Unsupported network. Please switch to Hardhat Local or Sepolia.",
        isAdmin: roles.isAdmin,
        isOrganizer: roles.isOrganizer,
        isVerifier: roles.isVerifier,
      });
    } catch (err: any) {
      console.error("Wallet sync error:", err);
      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: err.message || "Failed to sync wallet state",
      }));
    }
  }, []);

  const connect = useCallback(async () => {
    if (!(window as any).ethereum) {
      setWallet(prev => ({ ...prev, error: "MetaMask not found. Please install MetaMask to use this Web3 app." }));
      return;
    }

    setWallet(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      await syncState(accounts);
    } catch (err: any) {
      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: err?.message || "Failed to connect wallet",
      }));
    }
  }, [syncState]);

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      isAdmin: false,
      isOrganizer: false,
      isVerifier: false,
    });
  }, []);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!(window as any).ethereum) return;
    const hexChainId = "0x" + targetChainId.toString(16);
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        if (targetChainId === 31337) {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: "Hardhat Localhost",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              },
            ],
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    eth.request({ method: "eth_accounts" }).then(syncState);

    const handleAccounts = (accs: string[]) => syncState(accs);
    const handleChain = () => window.location.reload();

    eth.on("accountsChanged", handleAccounts);
    eth.on("chainChanged", handleChain);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccounts);
      eth.removeListener?.("chainChanged", handleChain);
    };
  }, [syncState]);

  return { wallet, connect, disconnect, switchNetwork };
}