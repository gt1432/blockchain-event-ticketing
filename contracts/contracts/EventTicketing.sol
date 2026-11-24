// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EventTicketing
 * @notice Decentralized event ticketing system using ERC-721 NFTs.
 *         Tickets are non-transferable except through the built-in
 *         resale marketplace, preventing scalping bypasses.
 * @dev Uses OpenZeppelin v5 contracts. Counters lib removed in v5 –
 *      manual uint256 counters are used instead.
 */
contract EventTicketing is ERC721URIStorage, AccessControl, ReentrancyGuard {
    // -------------------------------------------------------------------------
    // Roles
    // -------------------------------------------------------------------------
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant VERIFIER_ROLE  = keccak256("VERIFIER_ROLE");

    // -------------------------------------------------------------------------
    // Counters (OZ v5 removed Counters.sol)
    // -------------------------------------------------------------------------
    uint256 private _tokenIdCounter;
    uint256 private _eventIdCounter;

    // -------------------------------------------------------------------------
    // Platform fee (2.5 % = 250 / 10 000)
    // -------------------------------------------------------------------------
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5 %
    uint256 public constant BPS_DENOMINATOR  = 10_000;

    // -------------------------------------------------------------------------
    // Anti-scalping transfer gate
    // -------------------------------------------------------------------------
    /// @dev Set to true only inside buyResaleTicket to allow the internal transfer.
    bool private _transferAllowed;

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------
    struct Event {
        uint256 id;
        string  name;
        string  description;
        string  venue;
        uint256 date;           // Unix timestamp
        uint256 totalTickets;
        uint256 ticketsSold;
        uint256 ticketPrice;    // in wei
        uint256 maxResalePrice; // in wei
        address organizer;
        bool    isActive;
        string  imageURI;
    }

    struct Ticket {
        uint256 tokenId;
        uint256 eventId;
        address originalOwner;
        uint256 purchasePrice;
        bool    isRedeemed;
        bool    isListedForResale;
        uint256 resalePrice;
        uint256 purchaseTimestamp;
    }

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------
    /// eventId => Event
    mapping(uint256 => Event) private _events;

    /// tokenId => Ticket
    mapping(uint256 => Ticket) private _tickets;

    /// eventId => list of tokenIds
    mapping(uint256 => uint256[]) private _eventTickets;

    /// user => list of tokenIds (append-only; use ownerOf to verify current ownership)
    mapping(address => uint256[]) private _userTickets;

    /// set of tokenIds currently listed for resale
    uint256[] private _resaleListings;
    mapping(uint256 => uint256) private _resaleListingIndex; // tokenId => index+1 (0 = not listed)

    // -------------------------------------------------------------------------
    // Events (Solidity log events)
    // -------------------------------------------------------------------------
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string  name,
        uint256 ticketPrice,
        uint256 totalTickets
    );
    event TicketPurchased(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed buyer,
        uint256 price
    );
    event TicketMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 indexed eventId
    );
    event TicketListedForResale(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event TicketResold(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );
    event TicketRedeemed(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed attendee
    );
    event ResaleCancelled(
        uint256 indexed tokenId,
        address indexed owner
    );

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor() ERC721("EventTicket", "ETK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Role management
    // -------------------------------------------------------------------------

    /// @notice Grant ORGANIZER_ROLE to `account`. Admin only.
    function grantOrganizerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ORGANIZER_ROLE, account);
    }

    /// @notice Revoke ORGANIZER_ROLE from `account`. Admin only.
    function revokeOrganizerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ORGANIZER_ROLE, account);
    }

    /// @notice Grant or revoke VERIFIER_ROLE. Admin or organizer.
    function setVerifierRole(address verifier, bool grant) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(ORGANIZER_ROLE, msg.sender),
            "EventTicketing: caller is not admin or organizer"
        );
        if (grant) {
            _grantRole(VERIFIER_ROLE, verifier);
        } else {
            _revokeRole(VERIFIER_ROLE, verifier);
        }
    }

    // -------------------------------------------------------------------------
    // Event management
    // -------------------------------------------------------------------------

    /**
     * @notice Create a new ticketed event.
     * @dev Only accounts with ORGANIZER_ROLE may call this.
     */
    function createEvent(
        string  calldata name,
        string  calldata description,
        string  calldata venue,
        uint256 date,
        uint256 totalTickets,
        uint256 ticketPrice,
        uint256 maxResalePrice,
        string  calldata imageURI
    ) external onlyRole(ORGANIZER_ROLE) returns (uint256 eventId) {
        require(bytes(name).length > 0,        "EventTicketing: empty name");
        require(totalTickets > 0,              "EventTicketing: zero tickets");
        require(date > block.timestamp,        "EventTicketing: date in past");
        require(maxResalePrice >= ticketPrice, "EventTicketing: maxResalePrice < ticketPrice");

        eventId = ++_eventIdCounter;

        _events[eventId] = Event({
            id:             eventId,
            name:           name,
            description:    description,
            venue:          venue,
            date:           date,
            totalTickets:   totalTickets,
            ticketsSold:    0,
            ticketPrice:    ticketPrice,
            maxResalePrice: maxResalePrice,
            organizer:      msg.sender,
            isActive:       true,
            imageURI:       imageURI
        });

        emit EventCreated(eventId, msg.sender, name, ticketPrice, totalTickets);
    }

    /// @notice Update the image URI of an event. Only the organizer who created it.
    function updateEventImage(uint256 eventId, string calldata imageURI) external {
        Event storage ev = _events[eventId];
        require(ev.id != 0,                "EventTicketing: event not found");
        require(ev.organizer == msg.sender, "EventTicketing: not event organizer");
        ev.imageURI = imageURI;
    }

    // -------------------------------------------------------------------------
    // Primary ticket purchase
    // -------------------------------------------------------------------------

    /**
     * @notice Buy a ticket for `eventId`. Payment forwarded to organizer.
     * @dev Mints an ERC-721 token to the buyer.
     */
    function buyTicket(uint256 eventId) external payable nonReentrant returns (uint256 tokenId) {
        Event storage ev = _events[eventId];
        require(ev.id != 0,                        "EventTicketing: event not found");
        require(ev.isActive,                        "EventTicketing: event not active");
        require(ev.ticketsSold < ev.totalTickets,   "EventTicketing: sold out");
        require(msg.value >= ev.ticketPrice,        "EventTicketing: insufficient payment");

        // Effects
        tokenId = ++_tokenIdCounter;
        ev.ticketsSold++;

        _tickets[tokenId] = Ticket({
            tokenId:          tokenId,
            eventId:          eventId,
            originalOwner:    msg.sender,
            purchasePrice:    ev.ticketPrice,
            isRedeemed:       false,
            isListedForResale:false,
            resalePrice:      0,
            purchaseTimestamp:block.timestamp
        });

        _eventTickets[eventId].push(tokenId);
        _userTickets[msg.sender].push(tokenId);

        // Interactions – mint NFT (uses _transferAllowed flag; minting from zero is always allowed)
        _safeMint(msg.sender, tokenId);

        // Forward payment to organizer
        (bool sent, ) = payable(ev.organizer).call{value: ev.ticketPrice}("");
        require(sent, "EventTicketing: payment transfer failed");

        // Refund overpayment
        if (msg.value > ev.ticketPrice) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - ev.ticketPrice}("");
            require(refunded, "EventTicketing: refund failed");
        }

        emit TicketPurchased(tokenId, eventId, msg.sender, ev.ticketPrice);
        emit TicketMinted(tokenId, msg.sender, eventId);
    }

    // -------------------------------------------------------------------------
    // Resale marketplace
    // -------------------------------------------------------------------------

    /// @notice List a ticket for resale at `price` (must not exceed maxResalePrice).
    function listTicketForResale(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender,     "EventTicketing: not ticket owner");
        Ticket storage t = _tickets[tokenId];
        require(!t.isRedeemed,                       "EventTicketing: ticket already redeemed");
        require(!t.isListedForResale,                "EventTicketing: already listed");

        Event storage ev = _events[t.eventId];
        require(price <= ev.maxResalePrice,          "EventTicketing: price exceeds max resale price");
        require(price > 0,                           "EventTicketing: price must be > 0");

        t.isListedForResale = true;
        t.resalePrice = price;

        // Add to resale index
        _resaleListings.push(tokenId);
        _resaleListingIndex[tokenId] = _resaleListings.length; // 1-based

        emit TicketListedForResale(tokenId, msg.sender, price);
    }

    /// @notice Cancel an active resale listing.
    function cancelResaleListing(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "EventTicketing: not ticket owner");
        Ticket storage t = _tickets[tokenId];
        require(t.isListedForResale,            "EventTicketing: not listed");

        _removeListing(tokenId);
        t.isListedForResale = false;
        t.resalePrice = 0;

        emit ResaleCancelled(tokenId, msg.sender);
    }

    /**
     * @notice Buy a resale ticket. 2.5 % platform fee deducted; remainder sent to seller.
     */
    function buyResaleTicket(uint256 tokenId) external payable nonReentrant {
        Ticket storage t = _tickets[tokenId];
        require(t.isListedForResale,                       "EventTicketing: not listed for resale");
        require(!t.isRedeemed,                             "EventTicketing: ticket already redeemed");
        require(msg.value >= t.resalePrice,                "EventTicketing: insufficient payment");

        address seller = ownerOf(tokenId);
        require(seller != msg.sender,                      "EventTicketing: cannot buy own ticket");

        uint256 salePrice = t.resalePrice;
        uint256 platformFee = (salePrice * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 sellerProceeds = salePrice - platformFee;

        // Effects
        _removeListing(tokenId);
        t.isListedForResale = false;
        t.resalePrice = 0;
        _userTickets[msg.sender].push(tokenId);

        // Interaction – transfer NFT using the guarded hook
        _transferAllowed = true;
        _safeTransfer(seller, msg.sender, tokenId);
        _transferAllowed = false;

        // Pay seller
        (bool sellerPaid, ) = payable(seller).call{value: sellerProceeds}("");
        require(sellerPaid, "EventTicketing: seller payment failed");

        // Platform fee stays in contract (admin can withdraw or it accumulates)
        // Refund overpayment
        if (msg.value > salePrice) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - salePrice}("");
            require(refunded, "EventTicketing: refund failed");
        }

        emit TicketResold(tokenId, seller, msg.sender, salePrice);
    }

    // -------------------------------------------------------------------------
    // Ticket redemption
    // -------------------------------------------------------------------------

    /// @notice Mark a ticket as used at the event entrance. VERIFIER_ROLE only.
    function redeemTicket(uint256 tokenId) external onlyRole(VERIFIER_ROLE) {
        Ticket storage t = _tickets[tokenId];
        require(t.tokenId != 0,  "EventTicketing: ticket not found");
        require(!t.isRedeemed,    "EventTicketing: ticket already redeemed");

        // If listed, remove from marketplace first
        if (t.isListedForResale) {
            _removeListing(tokenId);
            t.isListedForResale = false;
            t.resalePrice = 0;
        }

        t.isRedeemed = true;
        emit TicketRedeemed(tokenId, t.eventId, ownerOf(tokenId));
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    function getEventDetails(uint256 eventId) external view returns (Event memory) {
        require(_events[eventId].id != 0, "EventTicketing: event not found");
        return _events[eventId];
    }

    function getTicketDetails(uint256 tokenId) external view returns (Ticket memory) {
        require(_tickets[tokenId].tokenId != 0, "EventTicketing: ticket not found");
        return _tickets[tokenId];
    }

    function getTicketOwner(uint256 tokenId) external view returns (address) {
        return ownerOf(tokenId);
    }

    function getEventTickets(uint256 eventId) external view returns (uint256[] memory) {
        return _eventTickets[eventId];
    }

    /// @notice Returns all token IDs ever associated with `user`.
    ///         Callers should verify current ownership via ownerOf.
    function getUserTickets(address user) external view returns (uint256[] memory) {
        return _userTickets[user];
    }

    function getResaleListings() external view returns (uint256[] memory) {
        return _resaleListings;
    }

    function getTotalEvents() external view returns (uint256) {
        return _eventIdCounter;
    }

    function getTotalTickets() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // -------------------------------------------------------------------------
    // Admin: withdraw accumulated platform fees
    // -------------------------------------------------------------------------
    function withdrawPlatformFees(address payable recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "EventTicketing: no fees to withdraw");
        (bool sent, ) = recipient.call{value: balance}("");
        require(sent, "EventTicketing: withdrawal failed");
    }

    // -------------------------------------------------------------------------
    // Anti-scalping: override ERC-721 transfer hook
    // -------------------------------------------------------------------------

    /**
     * @dev Override _update (OZ ERC721 v5 transfer hook).
     *      Block all transfers EXCEPT:
     *        - Minting (from == address(0))
     *        - Calls originating from buyResaleTicket (_transferAllowed == true)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && !_transferAllowed) {
            revert("EventTicketing: direct transfers disabled; use the resale marketplace");
        }
        return super._update(to, tokenId, auth);
    }

    // -------------------------------------------------------------------------
    // supportsInterface
    // -------------------------------------------------------------------------
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /// @dev Remove a tokenId from the _resaleListings array (swap-and-pop).
    function _removeListing(uint256 tokenId) internal {
        uint256 idx = _resaleListingIndex[tokenId];
        require(idx != 0, "EventTicketing: not in listing index");

        uint256 arrayIndex = idx - 1;
        uint256 lastTokenId = _resaleListings[_resaleListings.length - 1];

        _resaleListings[arrayIndex] = lastTokenId;
        _resaleListingIndex[lastTokenId] = idx;

        _resaleListings.pop();
        delete _resaleListingIndex[tokenId];
    }
}
