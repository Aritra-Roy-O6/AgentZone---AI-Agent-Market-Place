module agent_marketplace::marketplace {
    use std::signer;
    use std::string::String;
    use std::vector; // Enable Lists
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::account;

    // --- Errors ---
    const E_NOT_INITIALIZED: u64 = 1;
    const E_INVALID_INDEX: u64 = 2; // New Error

    // --- Structs ---

    // 1. The Agent Data (Now just a data piece, not a storage key)
    struct AgentListing has store, drop { 
        price: u64,
        metadata_ipfs_hash: String,
    }

    // 2. The Portfolio (Holds a list of agents for one creator)
    struct AgentPortfolio has key {
        agents: vector<AgentListing>
    }

    // 3. Events
    struct MarketEvents has key {
        purchase_events: event::EventHandle<PurchaseEvent>,
    }

    struct PurchaseEvent has drop, store {
        buyer: address,
        creator: address,
        agent_id: u64, // Added ID
        price_paid: u64,
        timestamp: u64,
    }

    // --- Functions ---

    fun init_module(admin: &signer) {
        let events = MarketEvents {
            purchase_events: account::new_event_handle<PurchaseEvent>(admin),
        };
        move_to(admin, events);
    }

    // 2. Register Agent (Updated for Multiple)
    public entry fun register_agent(
        creator: &signer, 
        price: u64, 
        ipfs_hash: String
    ) acquires AgentPortfolio {
        let creator_addr = signer::address_of(creator);
        
        // If portfolio doesn't exist, create it
        if (!exists<AgentPortfolio>(creator_addr)) {
            move_to(creator, AgentPortfolio { agents: vector::empty() });
        };

        // Add new agent to the list
        let portfolio = borrow_global_mut<AgentPortfolio>(creator_addr);
        vector::push_back(&mut portfolio.agents, AgentListing {
            price,
            metadata_ipfs_hash: ipfs_hash
        });
    }

    // 3. Pay for Agent (Updated)
    public entry fun purchase_call(
        buyer: &signer, 
        creator_addr: address,
        agent_id: u64, // Which agent to buy? (0, 1, 2...)
        days: u64 
    ) acquires AgentPortfolio, MarketEvents {
        
        // A. Get the specific agent from the list
        let portfolio = borrow_global<AgentPortfolio>(creator_addr);
        
        // Check if ID is valid
        assert!(agent_id < vector::length(&portfolio.agents), E_INVALID_INDEX);

        let listing = vector::borrow(&portfolio.agents, agent_id);
        let total_price = listing.price * days;

        // B. Transfer Payment
        coin::transfer<AptosCoin>(buyer, creator_addr, total_price);

        // C. Emit Event
        let module_owner_addr = @agent_marketplace;
        let market_events = borrow_global_mut<MarketEvents>(module_owner_addr);
        
        event::emit_event(&mut market_events.purchase_events, PurchaseEvent {
            buyer: signer::address_of(buyer),
            creator: creator_addr,
            agent_id,
            price_paid: total_price,
            timestamp: timestamp::now_seconds(),
        });
    }
}