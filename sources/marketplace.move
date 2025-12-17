module agent_marketplace::marketplace {
    use std::signer;
    use std::string::String;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::account;

    // --- Errors (for debugging) ---
    const E_NOT_INITIALIZED: u64 = 1;
    const E_INSUFFICIENT_FUNDS: u64 = 2;

    // --- Structs (The Data Models) ---

    // 1. The Agent Listing (Stored on Creator's address)
    struct AgentListing has key {
        price: u64,
        metadata_ipfs_hash: String, // Link to description/image
    }

    // 2. The Event Box (Stored on the Contract Owner's address)
    // We need this to "emit" signals that your Node.js backend will listen to.
    struct MarketEvents has key {
        purchase_events: event::EventHandle<PurchaseEvent>,
    }

    // 3. The Signal (The data emitted when someone pays)
    struct PurchaseEvent has drop, store {
        buyer: address,
        creator: address,
        price_paid: u64,
        timestamp: u64,
    }

    // --- Functions ---

    // 1. Setup (Run once by you to enable event tracking)
    fun init_module(admin: &signer) {
        let events = MarketEvents {
            purchase_events: account::new_event_handle<PurchaseEvent>(admin),
        };
        move_to(admin, events);
    }

    // 2. Register Agent (Called by AI Creators)
    public entry fun register_agent(
        creator: &signer, 
        price: u64, 
        ipfs_hash: String
    ) {
        let listing = AgentListing {
            price,
            metadata_ipfs_hash: ipfs_hash,
        };
        // Save this listing inside the creator's account storage
        move_to(creator, listing);
    }

    // 3. Pay for Agent (Called by Users)
    public entry fun purchase_call(
        buyer: &signer, 
        creator_addr: address
    ) acquires AgentListing, MarketEvents {
        
        // A. Get the agent info from the Creator's address
        let listing = borrow_global<AgentListing>(creator_addr);
        let price = listing.price;

        // B. Transfer Aptos Coin (Money moves from Buyer -> Creator)
        coin::transfer<AptosCoin>(buyer, creator_addr, price);

        // C. Emit the Event (This is what your Backend waits for!)
        // We get the event handle from the deployer's address (@agent_marketplace)
        let module_owner_addr = @agent_marketplace;
        let market_events = borrow_global_mut<MarketEvents>(module_owner_addr);
        
        event::emit_event(&mut market_events.purchase_events, PurchaseEvent {
            buyer: signer::address_of(buyer),
            creator: creator_addr,
            price_paid: price,
            timestamp: timestamp::now_seconds(),
        });
    }
}