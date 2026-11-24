import { ethers } from "hardhat";

async function main() {
  console.log("Seeding demo data for EventTicketing...");

  const [admin, organizer, buyer, verifier] = await ethers.getSigners();
  console.log("Admin:", admin.address);
  console.log("Organizer:", organizer.address);
  console.log("Buyer:", buyer.address);
  console.log("Verifier:", verifier.address);

  const EventTicketing = await ethers.getContractFactory("EventTicketing");
  const contract = await EventTicketing.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("EventTicketing deployed to:", address);

  // Grant roles
  await contract.connect(admin).grantOrganizerRole(organizer.address);
  await contract.connect(admin).setVerifierRole(verifier.address, true);
  console.log("Roles granted.");

  // Future timestamps (in seconds)
  const now = Math.floor(Date.now() / 1000);
  const date1 = now + 86400 * 15; // 15 days ahead
  const date2 = now + 86400 * 30; // 30 days ahead
  const date3 = now + 86400 * 45; // 45 days ahead

  // Event 1
  const tx1 = await contract.connect(organizer).createEvent(
    "Neon Horizon EDM Festival 2027",
    "The premier electronic dance music experience featuring world-class visual stages, laser installations, and top international DJ sets.",
    "Bandra Kurla Complex Arena, Mumbai",
    date1,
    250,
    ethers.parseEther("0.025"),
    ethers.parseEther("0.030"),
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80"
  );
  await tx1.wait();
  console.log("Event 1 created.");

  // Event 2
  const tx2 = await contract.connect(organizer).createEvent(
    "Web3 & Decentralized Future Summit",
    "Join global blockchain architects, smart contract auditors, and Web3 developers for 3 days of deep-dive workshops, keynotes, and hackathons.",
    "Whitefield Convention Center, Bengaluru",
    date2,
    500,
    ethers.parseEther("0.040"),
    ethers.parseEther("0.048"),
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80"
  );
  await tx2.wait();
  console.log("Event 2 created.");

  // Event 3
  const tx3 = await contract.connect(organizer).createEvent(
    "Rock Under The Stars - Live Stadium Concert",
    "An electrifying stadium rock concert featuring explosive live band performances, legendary anthems, and an unforgettable sound system.",
    "JLN Stadium, New Delhi",
    date3,
    150,
    ethers.parseEther("0.015"),
    ethers.parseEther("0.018"),
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80"
  );
  await tx3.wait();
  console.log("Event 3 created.");

  // Buyer purchases a ticket for Event 1
  const buyTx = await contract.connect(buyer).buyTicket(1, { value: ethers.parseEther("0.025") });
  await buyTx.wait();
  console.log("Buyer purchased Ticket #1 for Event 1.");

  // Buyer lists Ticket #1 for resale at 0.028 ETH (below 0.030 cap)
  const listTx = await contract.connect(buyer).listTicketForResale(1, ethers.parseEther("0.028"));
  await listTx.wait();
  console.log("Buyer listed Ticket #1 for resale at 0.028 ETH.");

  console.log("Seeding complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});