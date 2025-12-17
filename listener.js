require("dotenv").config();
const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

// Setup SDK just for resource checking (which we know works)
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

const CONTRACT_ADDRESS = process.env.MODULE_ADDRESS;
const MODULE_NAME = process.env.MODULE_NAME;

// The specific "box" where your events are stored
const STRUCT_NAME = `${CONTRACT_ADDRESS}::${MODULE_NAME}::MarketEvents`;
const FIELD_NAME = "purchase_events";

async function listenForPurchases() {
  console.log("🤖 AgentZone Listener is running... (Direct Node Mode)");
  console.log(`👀 Watching: ${STRUCT_NAME}`);

  let nextSequenceNumber = 0;

  setInterval(async () => {
    try {
      // 1. Check the "Counter" to see if anything happened
      // We know this part works because your logs showed "Total: 1" before.
      const resource = await aptos.getAccountResource({
        accountAddress: CONTRACT_ADDRESS,
        resourceType: STRUCT_NAME,
      });

      const eventHandle = resource.purchase_events;
      const totalEvents = Number(eventHandle.counter);

      // If we are up to date, do nothing
      if (nextSequenceNumber >= totalEvents) return;

      console.log(`⚡ New Event Detected! Fetching details...`);

      // 2. Fetch the actual data using raw HTTP (Bypassing SDK/Indexer issues)
      // This hits the Fullnode API directly.
      const url = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${CONTRACT_ADDRESS}/events/${STRUCT_NAME}/${FIELD_NAME}?start=${nextSequenceNumber}&limit=10`;
      
      const response = await fetch(url);
      const events = await response.json();

      // 3. Process the events
      for (const event of events) {
        // The Node API returns sequence_number as a string
        const seq = Number(event.sequence_number);
        const { buyer, price_paid } = event.data;

        console.log(`-----------------------------------------------`);
        console.log(`💰 PAYMENT RECEIVED! (Seq: ${seq})`);
        console.log(`   From User: ${buyer}`);
        console.log(`   Amount: ${price_paid} Octas`);
        console.log(`✅ AI AGENT ACTIVATED: Generating response...`);
        console.log(`-----------------------------------------------`);

        // Update our cursor
        nextSequenceNumber = seq + 1;
      }

    } catch (error) {
      console.error("❌ Error:", error.message || error);
    }
  }, 2000); // Check every 2 seconds
}

listenForPurchases();
