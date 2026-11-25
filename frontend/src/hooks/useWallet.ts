import { useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers";
import { WalletState, DemoRole } from "../types";
import {
  SUPPORTED_NETWORKS,
  checkUserRoles,
  DEMO_ACCOUNTS,
  setDemoWallet,
} from "../services/web3Service";

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
    isDemo: false,
    demoRole: undefined,
  });

  const syncState = useCallback(async (accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      // Check if user previously chosen a demo account
      const savedDemo = typeof window !== "undefined" ? (localStorage.getItem("ticketchain_demo_role") as DemoRole | null) : null;
      if (savedDemo && DEMO_ACCOUNTS[savedDemo]) {
        connectDemo(savedDemo);
        return;
      }

      setWallet({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
        isAdmin: false,
        isOrganizer: false,
        isVerifier: false,
        isDemo: false,
        demoRole: undefined,
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

      setDemoWallet(false);
      try {
        localStorage.removeItem("ticketchain_demo_role");
      } catch {}

      setWallet({
        address,
        chainId,
        isConnected: true,
        isConnecting: false,
        error: isSupported ? null : "Unsupported network. Please switch to Hardhat Local or Sepolia.",
        isAdmin: roles.isAdmin,
        isOrganizer: roles.isOrganizer,
        isVerifier: roles.isVerifier,
        isDemo: false,
        demoRole: undefined,
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

  const connectDemo = useCallback((role: DemoRole = "attendee") => {
    const account = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.attendee;
    setDemoWallet(true, role, account.address);
    try {
      localStorage.setItem("ticketchain_demo_role", role);
    } catch {}

    setWallet({
      address: account.address,
      chainId: 31337,
      isConnected: true,
      isConnecting: false,
      error: null,
      isAdmin: true,
      isOrganizer: role === "organizer" || role === "attendee",
      isVerifier: role === "verifier" || role === "organizer",
      isDemo: true,
      demoRole: role,
    });
  }, []);

  const connect = useCallback(async () => {
    if (!(window as any).ethereum) {
      // Auto-fallback to attendee demo if MetaMask is missing and advise user
      connectDemo("attendee");
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
  }, [syncState, connectDemo]);

  const disconnect = useCallback(() => {
    try {
      localStorage.removeItem("ticketchain_demo_role");
    } catch {}
    setDemoWallet(false);

    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      isAdmin: false,
      isOrganizer: false,
      isVerifier: false,
      isDemo: false,
      demoRole: undefined,
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
    if (!eth) {
      // Check saved demo role
      const savedDemo = typeof window !== "undefined" ? (localStorage.getItem("ticketchain_demo_role") as DemoRole | null) : null;
      if (savedDemo && DEMO_ACCOUNTS[savedDemo]) {
        connectDemo(savedDemo);
      }
      return;
    }

    eth.request({ method: "eth_accounts" }).then(syncState);

    const handleAccounts = (accs: string[]) => syncState(accs);
    const handleChain = () => window.location.reload();

    eth.on("accountsChanged", handleAccounts);
    eth.on("chainChanged", handleChain);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccounts);
      eth.removeListener?.("chainChanged", handleChain);
    };
  }, [syncState, connectDemo]);

  return { wallet, connect, connectDemo, disconnect, switchNetwork };
}
