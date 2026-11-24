import { ethers, BrowserProvider, Contract } from "ethers";
import EventTicketingABI from "../constants/EventTicketing.abi.json";
import deployments from "../constants/deployments.json";
import { EventItem, TicketItem, ResaleListingItem } from "../types";

export const CONTRACT_ADDRESS =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS || deployments.contractAddress;

export const SUPPORTED_NETWORKS: Record<number, { name: string; currency: string; explorer: string }> = {
  31337: {
    name: "Hardhat Localhost",
    currency: "ETH",
    explorer: "http://localhost:8545",
  },
  11155111: {
    name: "Ethereum Sepolia",
    currency: "SepoliaETH",
    explorer: "https://sepolia.etherscan.io",
  },
};

export const ORGANIZER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORGANIZER_ROLE"));
export const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
export const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

export function getProvider(): BrowserProvider | null {
  if (typeof window === "undefined" || !(window as any).ethereum) return null;
  return new BrowserProvider((window as any).ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  if (!provider) throw new Error("No Web3 wallet found. Please install MetaMask.");
  return provider.getSigner();
}

export async function getReadOnlyContract(): Promise<Contract> {
  const provider = getProvider();
  if (!provider) {
    const fallbackProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    return new Contract(CONTRACT_ADDRESS, EventTicketingABI, fallbackProvider);
  }
  return new Contract(CONTRACT_ADDRESS, EventTicketingABI, provider);
}

export async function getSignerContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(CONTRACT_ADDRESS, EventTicketingABI, signer);
}

export function formatEth(wei: bigint | string | number): string {
  try {
    const val = typeof wei === "bigint" ? wei : BigInt(wei.toString());
    return parseFloat(ethers.formatEther(val)).toFixed(4);
  } catch {
    return "0.0000";
  }
}

export function ethToInr(ethAmount: string | number): string {
  const rate = 250000;
  const num = typeof ethAmount === "number" ? ethAmount : parseFloat(ethAmount || "0");
  const inr = Math.round(num * rate);
  return inr.toLocaleString("en-IN");
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return address.slice(0, 6) + "..." + address.slice(-4);
}

export function getExplorerUrl(chainId: number, txHash: string): string {
  const net = SUPPORTED_NETWORKS[chainId];
  if (net && net.explorer.startsWith("http") && txHash) {
    return `${net.explorer}/tx/${txHash}`;
  }
  return "#";
}

export async function fetchAllEvents(): Promise<EventItem[]> {
  try {
    const contract = await getReadOnlyContract();
    const total = await contract.getTotalEvents();
    const count = Number(total);
    const list: EventItem[] = [];

    for (let i = 1; i <= count; i++) {
      try {
        const e = await contract.getEventDetails(i);
        list.push({
          id: Number(e.id),
          name: e.name,
          description: e.description,
          venue: e.venue,
          date: Number(e.date),
          totalTickets: Number(e.totalTickets),
          ticketsSold: Number(e.ticketsSold),
          ticketPrice: e.ticketPrice,
          maxResalePrice: e.maxResalePrice,
          organizer: e.organizer,
          isActive: e.isActive,
          imageURI: e.imageURI || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80",
        });
      } catch (err) {
        console.warn("Could not fetch event", i, err);
      }
    }
    return list;
  } catch (error) {
    console.error("fetchAllEvents error:", error);
    return [];
  }
}

export async function fetchEventById(eventId: number): Promise<EventItem | null> {
  try {
    const contract = await getReadOnlyContract();
    const e = await contract.getEventDetails(eventId);
    return {
      id: Number(e.id),
      name: e.name,
      description: e.description,
      venue: e.venue,
      date: Number(e.date),
      totalTickets: Number(e.totalTickets),
      ticketsSold: Number(e.ticketsSold),
      ticketPrice: e.ticketPrice,
      maxResalePrice: e.maxResalePrice,
      organizer: e.organizer,
      isActive: e.isActive,
      imageURI: e.imageURI || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80",
    };
  } catch (err) {
    console.error("fetchEventById error:", err);
    return null;
  }
}

export async function fetchUserTickets(userAddress: string): Promise<TicketItem[]> {
  try {
    const contract = await getReadOnlyContract();
    const tokenIds = await contract.getUserTickets(userAddress);
    const tickets: TicketItem[] = [];

    for (const tid of tokenIds) {
      try {
        const currentOwner = await contract.getTicketOwner(tid);
        if (currentOwner.toLowerCase() === userAddress.toLowerCase()) {
          const t = await contract.getTicketDetails(tid);
          const ev = await contract.getEventDetails(t.eventId);
          tickets.push({
            tokenId: Number(t.tokenId),
            eventId: Number(t.eventId),
            originalOwner: t.originalOwner,
            purchasePrice: t.purchasePrice,
            isRedeemed: t.isRedeemed,
            isListedForResale: t.isListedForResale,
            resalePrice: t.resalePrice,
            purchaseTimestamp: Number(t.purchaseTimestamp),
            currentOwner,
            event: {
              id: Number(ev.id),
              name: ev.name,
              description: ev.description,
              venue: ev.venue,
              date: Number(ev.date),
              totalTickets: Number(ev.totalTickets),
              ticketsSold: Number(ev.ticketsSold),
              ticketPrice: ev.ticketPrice,
              maxResalePrice: ev.maxResalePrice,
              organizer: ev.organizer,
              isActive: ev.isActive,
              imageURI: ev.imageURI,
            },
          });
        }
      } catch (e) {
        console.warn("Failed to fetch ticket", tid, e);
      }
    }
    return tickets;
  } catch (error) {
    console.error("fetchUserTickets error:", error);
    return [];
  }
}

export async function fetchResaleListings(): Promise<ResaleListingItem[]> {
  try {
    const contract = await getReadOnlyContract();
    const tokenIds = await contract.getResaleListings();
    const listings: ResaleListingItem[] = [];

    for (const tid of tokenIds) {
      try {
        const t = await contract.getTicketDetails(tid);
        if (t.isListedForResale && !t.isRedeemed) {
          const ev = await contract.getEventDetails(t.eventId);
          const seller = await contract.getTicketOwner(tid);
          listings.push({
            tokenId: Number(t.tokenId),
            eventId: Number(t.eventId),
            seller,
            price: t.resalePrice,
            originalPrice: ev.ticketPrice,
            maxResalePrice: ev.maxResalePrice,
            eventName: ev.name,
            eventDate: Number(ev.date),
            eventVenue: ev.venue,
            imageURI: ev.imageURI || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80",
          });
        }
      } catch (e) {
        console.warn("Failed to load listing for token", tid, e);
      }
    }
    return listings;
  } catch (err) {
    console.error("fetchResaleListings error:", err);
    return [];
  }
}

export async function checkUserRoles(address: string) {
  try {
    const contract = await getReadOnlyContract();
    const [isAdmin, isOrganizer, isVerifier] = await Promise.all([
      contract.hasRole(DEFAULT_ADMIN_ROLE, address),
      contract.hasRole(ORGANIZER_ROLE, address),
      contract.hasRole(VERIFIER_ROLE, address),
    ]);
    return { isAdmin, isOrganizer, isVerifier };
  } catch {
    return { isAdmin: false, isOrganizer: false, isVerifier: false };
  }
}

export async function createEvent(
  name: string,
  description: string,
  venue: string,
  dateUnix: number,
  totalTickets: number,
  ticketPriceEth: string,
  maxResalePriceEth: string,
  imageURI: string
) {
  const contract = await getSignerContract();
  const priceWei = ethers.parseEther(ticketPriceEth);
  const maxPriceWei = ethers.parseEther(maxResalePriceEth);
  return contract.createEvent(
    name,
    description,
    venue,
    dateUnix,
    totalTickets,
    priceWei,
    maxPriceWei,
    imageURI
  );
}

export async function buyTicket(eventId: number, priceWei: bigint) {
  const contract = await getSignerContract();
  return contract.buyTicket(eventId, { value: priceWei });
}

export async function listTicketForResale(tokenId: number, priceEth: string) {
  const contract = await getSignerContract();
  const priceWei = ethers.parseEther(priceEth);
  return contract.listTicketForResale(tokenId, priceWei);
}

export async function cancelResaleListing(tokenId: number) {
  const contract = await getSignerContract();
  return contract.cancelResaleListing(tokenId);
}

export async function buyResaleTicket(tokenId: number, priceWei: bigint) {
  const contract = await getSignerContract();
  return contract.buyResaleTicket(tokenId, { value: priceWei });
}

export async function redeemTicket(tokenId: number) {
  const contract = await getSignerContract();
  return contract.redeemTicket(tokenId);
}

export async function grantOrganizerRole(address: string) {
  const contract = await getSignerContract();
  return contract.grantOrganizerRole(address);
}

export async function revokeOrganizerRole(address: string) {
  const contract = await getSignerContract();
  return contract.revokeOrganizerRole(address);
}

export async function setVerifierRole(verifier: string, grant: boolean) {
  const contract = await getSignerContract();
  return contract.setVerifierRole(verifier, grant);
}

export function generateTicketQRData(contractAddr: string, chainId: number, eventId: number, tokenId: number): string {
  return JSON.stringify({
    app: "TicketChain",
    v: 1,
    contract: contractAddr.toLowerCase(),
    chain: chainId,
    event: eventId,
    token: tokenId,
    ts: Date.now(),
  });
}