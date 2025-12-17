# AgentZone - Decentralized AI Marketplace
🚀 The Core Concept: Token-Gated Agent Access
Agentos is a marketplace where developers list AI agents, and users buy non-transferable licenses (SBTs) to access them.

We do not host the code. We host the gate.

The "Product" is the license (the SBT).

The "Utility" is that holding the license in your wallet unlocks the interface to use the agent.

1. For Sellers: "Minting the Access Rights"
Instead of just "uploading a file," the seller is effectively creating a new Collection on the blockchain.

The Input: The Seller provides the Agent Name, Price, and the "Secret Link" (HuggingFace/API Endpoint).

The Action:

Off-chain: You encrypt and store the "Secret Link" in your database.

On-chain: Your contract registers a new AgentCollection. This defines the price and the rules for minting licenses.

2. For Buyers: "The Purchase is the Mint"
When a user clicks "Buy," they aren't just sending money; they are executing a Mint Transaction.

The Transaction: The user sends APT to the Smart Contract.

The Smart Contract Logic:

Verifies the payment amount.

Forwards the APT to the Seller.

Mints a Soulbound Token (SBT) directly into the Buyer's wallet.

The SBT Properties:

Issuer: Agentos.

Collection: The specific Agent Name.

Transferability: DISABLED. (This ensures they cannot resell the license on a secondary market; they bought the right to use, not the right to distribute).

3. For the Platform: "The Gatekeeper"
This is how your web app decides who gets to use what.

Login: User connects their Aptos Wallet.

The Check: Your frontend/indexer scans the user's wallet for Agentos SBTs.

Does wallet 0x123... hold the SBT for "Math Agent"?

No? Show "Buy Now" button.

Yes? Show "Launch" button.

The Launch: When they click "Launch," your backend verifies the SBT one last time and then loads the secret HuggingFace URL (via proxy or iframe).