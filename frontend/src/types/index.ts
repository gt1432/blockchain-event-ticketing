export type DemoRole = 'attendee' | 'organizer' | 'verifier';

export interface EventItem {
  id: number;
  name: string;
  description: string;
  venue: string;
  date: number; // Unix timestamp in seconds
  totalTickets: number;
  ticketsSold: number;
  ticketPrice: bigint; // wei
  maxResalePrice: bigint; // wei
  organizer: string;
  isActive: boolean;
  imageURI: string;
}

export interface TicketItem {
  tokenId: number;
  eventId: number;
  originalOwner: string;
  purchasePrice: bigint;
  isRedeemed: boolean;
  isListedForResale: boolean;
  resalePrice: bigint;
  purchaseTimestamp: number;
  currentOwner?: string;
  event?: EventItem;
}

export interface ResaleListingItem {
  tokenId: number;
  eventId: number;
  seller: string;
  price: bigint;
  originalPrice: bigint;
  maxResalePrice: bigint;
  eventName: string;
  eventDate: number;
  eventVenue: string;
  imageURI: string;
}

export interface WalletState {
  isDemo?: boolean;
  demoRole?: DemoRole;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isAdmin: boolean;
  isOrganizer: boolean;
  isVerifier: boolean;
}

export interface TransactionState {
  hash: string | null;
  status: 'idle' | 'pending' | 'success' | 'error';
  error: string | null;
  description?: string;
}

export type VerificationStatus =
  | 'VALID'
  | 'ALREADY_USED'
  | 'INVALID_TICKET'
  | 'WRONG_EVENT'
  | 'UNAUTHORIZED_VERIFIER'
  | 'PENDING'
  | 'IDLE';

export interface VerificationResult {
  status: VerificationStatus;
  message?: string;
  tokenId?: number;
  eventId?: number;
  eventName?: string;
  owner?: string;
  isRedeemed?: boolean;
}
