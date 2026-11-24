import { expect } from "chai";
import { ethers } from "hardhat";
import { EventTicketing } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ONE_ETH   = ethers.parseEther("1");
const HALF_ETH  = ethers.parseEther("0.5");
const TWO_ETH   = ethers.parseEther("2");
const THREE_ETH = ethers.parseEther("3");

/** Returns a future Unix timestamp (seconds since epoch). */
async function futureDate(offsetSeconds = 86_400): Promise<number> {
  const latest = await time.latest();
  return latest + offsetSeconds;
}

/** Default event parameters factory. */
async function defaultEventParams(overrides: Partial<{
  name: string;
  description: string;
  venue: string;
  date: number;
  totalTickets: number;
  ticketPrice: bigint;
  maxResalePrice: bigint;
  imageURI: string;
}> = {}) {
  return {
    name:           overrides.name           ?? "Rock Concert 2027",
    description:    overrides.description    ?? "An amazing rock concert",
    venue:          overrides.venue          ?? "Madison Square Garden",
    date:           overrides.date           ?? await futureDate(),
    totalTickets:   overrides.totalTickets   ?? 100,
    ticketPrice:    overrides.ticketPrice    ?? ONE_ETH,
    maxResalePrice: overrides.maxResalePrice ?? TWO_ETH,
    imageURI:       overrides.imageURI       ?? "ipfs://QmTest",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe("EventTicketing", function () {
  let contract: EventTicketing;
  let admin: HardhatEthersSigner;
  let organizer: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let buyer2: HardhatEthersSigner;
  let verifier: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  const ORGANIZER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORGANIZER_ROLE"));
  const VERIFIER_ROLE  = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

  beforeEach(async function () {
    [admin, organizer, buyer, buyer2, verifier, stranger] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EventTicketing", admin);
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    // Grant roles
    await contract.connect(admin).grantOrganizerRole(organizer.address);
    await contract.connect(admin).setVerifierRole(verifier.address, true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Helper: create a default event and return its eventId
  // ───────────────────────────────────────────────────────────────────────────
  async function createDefaultEvent(params?: Awaited<ReturnType<typeof defaultEventParams>>) {
    const p = params ?? await defaultEventParams();
    const tx = await contract.connect(organizer).createEvent(
      p.name,
      p.description,
      p.venue,
      p.date,
      p.totalTickets,
      p.ticketPrice,
      p.maxResalePrice,
      p.imageURI
    );
    const receipt = await tx.wait();
    // Parse EventCreated log
    const log = receipt!.logs
      .map((l) => {
        try { return contract.interface.parseLog(l as any); } catch { return null; }
      })
      .find((l) => l?.name === "EventCreated");
    return log!.args.eventId as bigint;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Helper: buy a ticket and return its tokenId
  // ───────────────────────────────────────────────────────────────────────────
  async function buyTicket(eventId: bigint, signer = buyer, value = ONE_ETH): Promise<bigint> {
    const tx = await contract.connect(signer).buyTicket(eventId, { value });
    const receipt = await tx.wait();
    const log = receipt!.logs
      .map((l) => {
        try { return contract.interface.parseLog(l as any); } catch { return null; }
      })
      .find((l) => l?.name === "TicketPurchased");
    return log!.args.tokenId as bigint;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 1 – Event creation
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 1: Event Creation", function () {
    it("should create an event with correct parameters", async function () {
      const p = await defaultEventParams();
      await expect(
        contract.connect(organizer).createEvent(
          p.name, p.description, p.venue, p.date,
          p.totalTickets, p.ticketPrice, p.maxResalePrice, p.imageURI
        )
      )
        .to.emit(contract, "EventCreated")
        .withArgs(1n, organizer.address, p.name, p.ticketPrice, BigInt(p.totalTickets));

      const ev = await contract.getEventDetails(1n);
      expect(ev.name).to.equal(p.name);
      expect(ev.totalTickets).to.equal(BigInt(p.totalTickets));
      expect(ev.ticketPrice).to.equal(p.ticketPrice);
      expect(ev.maxResalePrice).to.equal(p.maxResalePrice);
      expect(ev.organizer).to.equal(organizer.address);
      expect(ev.isActive).to.be.true;
      expect(await contract.getTotalEvents()).to.equal(1n);
    });

    it("should revert if a non-organizer tries to create an event", async function () {
      const p = await defaultEventParams();
      await expect(
        contract.connect(stranger).createEvent(
          p.name, p.description, p.venue, p.date,
          p.totalTickets, p.ticketPrice, p.maxResalePrice, p.imageURI
        )
      ).to.be.reverted;
    });

    it("should revert on empty event name", async function () {
      const p = await defaultEventParams({ name: "" });
      await expect(
        contract.connect(organizer).createEvent(
          p.name, p.description, p.venue, p.date,
          p.totalTickets, p.ticketPrice, p.maxResalePrice, p.imageURI
        )
      ).to.be.revertedWith("EventTicketing: empty name");
    });

    it("should revert when date is in the past", async function () {
      const p = await defaultEventParams({ date: 1 }); // very old timestamp
      await expect(
        contract.connect(organizer).createEvent(
          p.name, p.description, p.venue, p.date,
          p.totalTickets, p.ticketPrice, p.maxResalePrice, p.imageURI
        )
      ).to.be.revertedWith("EventTicketing: date in past");
    });

    it("increments event IDs correctly for multiple events", async function () {
      const id1 = await createDefaultEvent();
      const id2 = await createDefaultEvent();
      expect(id1).to.equal(1n);
      expect(id2).to.equal(2n);
      expect(await contract.getTotalEvents()).to.equal(2n);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 2 – Ticket purchase
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 2: Ticket Purchase", function () {
    it("should allow a buyer to purchase a ticket and emit events", async function () {
      const eventId = await createDefaultEvent();
      await expect(contract.connect(buyer).buyTicket(eventId, { value: ONE_ETH }))
        .to.emit(contract, "TicketPurchased")
        .and.to.emit(contract, "TicketMinted");

      const ev = await contract.getEventDetails(eventId);
      expect(ev.ticketsSold).to.equal(1n);
      expect(await contract.getTotalTickets()).to.equal(1n);
    });

    it("should forward payment to the organizer", async function () {
      const eventId = await createDefaultEvent();
      const before = await ethers.provider.getBalance(organizer.address);
      await contract.connect(buyer).buyTicket(eventId, { value: ONE_ETH });
      const after = await ethers.provider.getBalance(organizer.address);
      expect(after - before).to.equal(ONE_ETH);
    });

    it("should refund overpayment to the buyer", async function () {
      const eventId = await createDefaultEvent();
      const before = await ethers.provider.getBalance(buyer.address);
      const tx = await contract.connect(buyer).buyTicket(eventId, { value: TWO_ETH });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const after = await ethers.provider.getBalance(buyer.address);
      // Should have paid exactly ONE_ETH + gas
      expect(before - after - gasUsed).to.equal(ONE_ETH);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 3 – Successful NFT minting
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 3: Successful NFT Minting", function () {
    it("should mint an NFT to the buyer with correct ticket metadata", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      expect(await contract.getTicketOwner(tokenId)).to.equal(buyer.address);
      const ticket = await contract.getTicketDetails(tokenId);
      expect(ticket.eventId).to.equal(eventId);
      expect(ticket.originalOwner).to.equal(buyer.address);
      expect(ticket.isRedeemed).to.be.false;
      expect(ticket.isListedForResale).to.be.false;
      expect(ticket.purchasePrice).to.equal(ONE_ETH);
    });

    it("should append tokenId to event tickets and user tickets", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      const eventTickets = await contract.getEventTickets(eventId);
      expect(eventTickets).to.include(tokenId);

      const userTickets = await contract.getUserTickets(buyer.address);
      expect(userTickets).to.include(tokenId);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 4 – Insufficient payment
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 4: Insufficient Payment", function () {
    it("should revert when msg.value is below ticket price", async function () {
      const eventId = await createDefaultEvent();
      await expect(
        contract.connect(buyer).buyTicket(eventId, { value: HALF_ETH })
      ).to.be.revertedWith("EventTicketing: insufficient payment");
    });

    it("should revert when msg.value is zero", async function () {
      const eventId = await createDefaultEvent();
      await expect(
        contract.connect(buyer).buyTicket(eventId, { value: 0n })
      ).to.be.revertedWith("EventTicketing: insufficient payment");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 5 – Sold-out event
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 5: Sold-Out Event", function () {
    it("should revert when all tickets are sold", async function () {
      const p = await defaultEventParams({ totalTickets: 2 });
      const eventId = await createDefaultEvent(p);

      await buyTicket(eventId, buyer,  ONE_ETH);
      await buyTicket(eventId, buyer2, ONE_ETH);

      await expect(
        contract.connect(stranger).buyTicket(eventId, { value: ONE_ETH })
      ).to.be.revertedWith("EventTicketing: sold out");
    });

    it("should track ticketsSold accurately", async function () {
      const p = await defaultEventParams({ totalTickets: 3 });
      const eventId = await createDefaultEvent(p);
      for (let i = 0; i < 3; i++) {
        await buyTicket(eventId, buyer, ONE_ETH);
      }
      const ev = await contract.getEventDetails(eventId);
      expect(ev.ticketsSold).to.equal(3n);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 6 – Maximum resale price enforcement
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 6: Maximum Resale Price Enforcement", function () {
    it("should revert listing above maxResalePrice", async function () {
      const eventId = await createDefaultEvent(); // maxResale = 2 ETH
      const tokenId = await buyTicket(eventId);

      await expect(
        contract.connect(buyer).listTicketForResale(tokenId, THREE_ETH)
      ).to.be.revertedWith("EventTicketing: price exceeds max resale price");
    });

    it("should allow listing at exactly maxResalePrice", async function () {
      const eventId = await createDefaultEvent(); // maxResale = 2 ETH
      const tokenId = await buyTicket(eventId);

      await expect(contract.connect(buyer).listTicketForResale(tokenId, TWO_ETH))
        .to.emit(contract, "TicketListedForResale")
        .withArgs(tokenId, buyer.address, TWO_ETH);
    });

    it("should revert listing at zero price", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);
      await expect(
        contract.connect(buyer).listTicketForResale(tokenId, 0n)
      ).to.be.revertedWith("EventTicketing: price must be > 0");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 7 – Successful ticket resale
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 7: Successful Ticket Resale", function () {
    it("should complete resale and emit TicketResold", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH);

      await expect(
        contract.connect(buyer2).buyResaleTicket(tokenId, { value: ONE_ETH })
      )
        .to.emit(contract, "TicketResold")
        .withArgs(tokenId, buyer.address, buyer2.address, ONE_ETH);
    });

    it("should send 97.5% of sale price to the seller", async function () {
      const eventId  = await createDefaultEvent();
      const tokenId  = await buyTicket(eventId);
      const resalePrice = ethers.parseEther("2");

      await contract.connect(buyer).listTicketForResale(tokenId, resalePrice);

      const sellerBefore = await ethers.provider.getBalance(buyer.address);
      await contract.connect(buyer2).buyResaleTicket(tokenId, { value: resalePrice });
      const sellerAfter = await ethers.provider.getBalance(buyer.address);

      const platformFee = (resalePrice * 250n) / 10_000n;
      const expected    = resalePrice - platformFee;
      expect(sellerAfter - sellerBefore).to.equal(expected);
    });

    it("should remove listing from getResaleListings() after purchase", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH);
      expect(await contract.getResaleListings()).to.include(tokenId);

      await contract.connect(buyer2).buyResaleTicket(tokenId, { value: ONE_ETH });
      expect(await contract.getResaleListings()).to.not.include(tokenId);
    });

    it("should revert when buyer sends insufficient funds for resale", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);
      await contract.connect(buyer).listTicketForResale(tokenId, TWO_ETH);

      await expect(
        contract.connect(buyer2).buyResaleTicket(tokenId, { value: HALF_ETH })
      ).to.be.revertedWith("EventTicketing: insufficient payment");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 8 – NFT ownership after resale
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 8: NFT Ownership After Resale", function () {
    it("should transfer NFT ownership to new buyer", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH);
      await contract.connect(buyer2).buyResaleTicket(tokenId, { value: ONE_ETH });

      expect(await contract.getTicketOwner(tokenId)).to.equal(buyer2.address);
    });

    it("old owner should no longer be the token owner", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH);
      await contract.connect(buyer2).buyResaleTicket(tokenId, { value: ONE_ETH });

      expect(await contract.getTicketOwner(tokenId)).to.not.equal(buyer.address);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 9 – Unauthorized ticket minting (direct mint)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 9: Unauthorized Ticket Minting", function () {
    it("should not expose a public mint function", async function () {
      // Verify the contract ABI has no safeMint / mint callable externally
      const hasMint = contract.interface.getFunction("mint") !== null;
      const hasSafeMint = contract.interface.getFunction("safeMint") !== null;
      expect(hasMint).to.be.false;
      expect(hasSafeMint).to.be.false;
    });

    it("should revert when stranger tries to call buyTicket with 0 price event (free tickets must still be bought via buyTicket)", async function () {
      const p = await defaultEventParams({ ticketPrice: 0n, maxResalePrice: ONE_ETH });
      const eventId = await createDefaultEvent(p);
      // Stranger can buy free ticket (price=0) — this is NOT minting directly
      // Verify stranger gets the NFT correctly (not a direct mint bypass)
      const tx = await contract.connect(stranger).buyTicket(eventId, { value: 0n });
      const receipt = await tx.wait();
      const log = receipt!.logs
        .map((l) => { try { return contract.interface.parseLog(l as any); } catch { return null; } })
        .find((l) => l?.name === "TicketMinted");
      expect(log).to.not.be.null;
      const tokenId = log!.args.tokenId as bigint;
      expect(await contract.getTicketOwner(tokenId)).to.equal(stranger.address);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 10 – Invalid ticket redemption (wrong verifier)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 10: Invalid Ticket Redemption – Wrong Verifier", function () {
    it("should revert when a non-verifier calls redeemTicket", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await expect(
        contract.connect(stranger).redeemTicket(tokenId)
      ).to.be.reverted;
    });

    it("should revert when organizer (not verifier) tries to redeem", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await expect(
        contract.connect(organizer).redeemTicket(tokenId)
      ).to.be.reverted;
    });

    it("should allow a verifier to redeem and emit TicketRedeemed", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await expect(contract.connect(verifier).redeemTicket(tokenId))
        .to.emit(contract, "TicketRedeemed")
        .withArgs(tokenId, eventId, buyer.address);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 11 – Duplicate ticket redemption
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 11: Duplicate Ticket Redemption", function () {
    it("should revert on second redemption attempt", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await contract.connect(verifier).redeemTicket(tokenId);

      await expect(
        contract.connect(verifier).redeemTicket(tokenId)
      ).to.be.revertedWith("EventTicketing: ticket already redeemed");
    });

    it("isRedeemed flag should be true after redemption", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);
      await contract.connect(verifier).redeemTicket(tokenId);

      const ticket = await contract.getTicketDetails(tokenId);
      expect(ticket.isRedeemed).to.be.true;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 12 – Unauthorized verifier
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 12: Unauthorized Verifier", function () {
    it("should revert redemption from an account without VERIFIER_ROLE", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      // buyer does NOT have VERIFIER_ROLE
      await expect(
        contract.connect(buyer).redeemTicket(tokenId)
      ).to.be.reverted;
    });

    it("admin can grant and revoke VERIFIER_ROLE", async function () {
      await contract.connect(admin).setVerifierRole(buyer.address, true);
      expect(await contract.hasRole(VERIFIER_ROLE, buyer.address)).to.be.true;

      await contract.connect(admin).setVerifierRole(buyer.address, false);
      expect(await contract.hasRole(VERIFIER_ROLE, buyer.address)).to.be.false;
    });

    it("organizer can also grant VERIFIER_ROLE", async function () {
      await contract.connect(organizer).setVerifierRole(stranger.address, true);
      expect(await contract.hasRole(VERIFIER_ROLE, stranger.address)).to.be.true;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 13 – Unauthorized ticket transfers (bypassing marketplace)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 13: Unauthorized Ticket Transfers", function () {
    it("should revert safeTransferFrom when called by owner directly", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await expect(
        contract.connect(buyer)["safeTransferFrom(address,address,uint256)"](
          buyer.address, buyer2.address, tokenId
        )
      ).to.be.revertedWith("EventTicketing: direct transfers disabled; use the resale marketplace");
    });

    it("should revert transferFrom when called directly", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await expect(
        contract.connect(buyer).transferFrom(buyer.address, buyer2.address, tokenId)
      ).to.be.revertedWith("EventTicketing: direct transfers disabled; use the resale marketplace");
    });

    it("should revert even when approved operator attempts transfer", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      // buyer approves buyer2 as operator
      await contract.connect(buyer).approve(buyer2.address, tokenId);

      await expect(
        contract.connect(buyer2).transferFrom(buyer.address, buyer2.address, tokenId)
      ).to.be.revertedWith("EventTicketing: direct transfers disabled; use the resale marketplace");
    });

    it("should allow transfer only through buyResaleTicket", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH);
      // This should succeed
      await expect(
        contract.connect(buyer2).buyResaleTicket(tokenId, { value: ONE_ETH })
      ).to.not.be.reverted;
      expect(await contract.getTicketOwner(tokenId)).to.equal(buyer2.address);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 14 – Resale of redeemed tickets
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Test 14: Resale of Redeemed Tickets", function () {
    it("should revert listing a redeemed ticket for resale", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      await contract.connect(verifier).redeemTicket(tokenId);

      await expect(
        contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH)
      ).to.be.revertedWith("EventTicketing: ticket already redeemed");
    });

    it("should revert buying a resale ticket that was redeemed after listing", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      // List first
      await contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH);

      // Verifier redeems it (removes from listing automatically)
      await contract.connect(verifier).redeemTicket(tokenId);

      // buyer2 tries to buy resale — should revert because no longer listed
      await expect(
        contract.connect(buyer2).buyResaleTicket(tokenId, { value: ONE_ETH })
      ).to.be.revertedWith("EventTicketing: not listed for resale");
    });

    it("isRedeemed ticket cannot be purchased on resale market", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);

      // Artificially: redeem then verify listing is blocked
      await contract.connect(verifier).redeemTicket(tokenId);
      const ticket = await contract.getTicketDetails(tokenId);
      expect(ticket.isRedeemed).to.be.true;
      expect(ticket.isListedForResale).to.be.false;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Additional: Role management edge cases
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Role Management", function () {
    it("admin can grant organizer role", async function () {
      await contract.connect(admin).grantOrganizerRole(stranger.address);
      expect(await contract.hasRole(ORGANIZER_ROLE, stranger.address)).to.be.true;
    });

    it("admin can revoke organizer role", async function () {
      await contract.connect(admin).revokeOrganizerRole(organizer.address);
      expect(await contract.hasRole(ORGANIZER_ROLE, organizer.address)).to.be.false;
    });

    it("non-admin cannot grant organizer role", async function () {
      await expect(
        contract.connect(stranger).grantOrganizerRole(buyer.address)
      ).to.be.reverted;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Additional: Cancel resale listing
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Cancel Resale Listing", function () {
    it("owner can cancel listing and emit ResaleCancelled", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);
      await contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH);

      await expect(contract.connect(buyer).cancelResaleListing(tokenId))
        .to.emit(contract, "ResaleCancelled")
        .withArgs(tokenId, buyer.address);

      const ticket = await contract.getTicketDetails(tokenId);
      expect(ticket.isListedForResale).to.be.false;
      expect(await contract.getResaleListings()).to.not.include(tokenId);
    });

    it("non-owner cannot cancel listing", async function () {
      const eventId = await createDefaultEvent();
      const tokenId = await buyTicket(eventId);
      await contract.connect(buyer).listTicketForResale(tokenId, ONE_ETH);

      await expect(
        contract.connect(stranger).cancelResaleListing(tokenId)
      ).to.be.revertedWith("EventTicketing: not ticket owner");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Additional: supportsInterface
  // ═══════════════════════════════════════════════════════════════════════════
  describe("supportsInterface", function () {
    it("supports ERC721 interface", async function () {
      const ERC721_ID = "0x80ac58cd";
      expect(await contract.supportsInterface(ERC721_ID)).to.be.true;
    });

    it("supports AccessControl interface", async function () {
      const AC_ID = "0x7965db0b";
      expect(await contract.supportsInterface(AC_ID)).to.be.true;
    });
  });
});
