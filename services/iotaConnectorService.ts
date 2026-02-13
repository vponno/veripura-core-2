import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { Transaction } from "@iota/iota-sdk/transactions";
import { MOCK_PRIVATE_KEY_USER, PACKAGE_ID, SPONSOR_ADDRESS } from '../constants'; // Assumed constants
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { fromB64 } from "@iota/iota-sdk/utils";

// Initialize Client (Connecting to IOTA Rebased Devnet)
const client = new IotaClient({ url: getFullnodeUrl("devnet") });

// Mock Gas Station Service (Simulating Backend)
const gasStationService = {
    signTransaction: async (txBytes: Uint8Array) => {
        // In a real app, this sends txBytes to a backend API which holds the Sponsor Private Key.
        // The backend validates the tx, signs it, and returns the signature.
        console.log("Mock Gas Station: Signing transaction...");
        // Return a dummy signature for simulation or implemented mock logic if keys available
        return "mock_sponsor_signature_base64";
    }
};

export const iotaConnectorService = {

    /**
     * Creates a Demand Order on the IOTA Blockchain.
     * Uses a Sponsored Transaction (Gas Station) pattern.
     */
    createDemandObject: async (
        productType: string,
        quantityKg: number,
        pricePerKg: number,
        deadlineIso: string
    ) => {
        try {
            // 1. Setup User Keypair (In real app, comes from Wallet Adapter)
            // Using a specific mock key or ephemeral key for this service demo
            // const keypair = Ed25519Keypair.fromSecretKey(fromB64(MOCK_PRIVATE_KEY_USER)); 
            // For browser usage, we typically use `wallet.signTransaction`, but here we simulate the service logic
            const userAddress = "0xUserAddress...";

            const tx = new Transaction();

            // 2. Configure Sponsored Transaction
            tx.setSender(userAddress);
            tx.setGasOwner(SPONSOR_ADDRESS);
            tx.setGasBudget(10_000_000); // 0.01 IOTA

            // 3. Convert Types for Move
            // Move: create_demand(String, u64, u64, u64)
            const deadlineTimestamp = new Date(deadlineIso).getTime();
            const priceScaled = Math.floor(pricePerKg * 100); // Cents

            // 4. Construct PTB
            tx.moveCall({
                target: `${PACKAGE_ID}::market::create_demand`,
                arguments: [
                    tx.pure.string(productType),
                    tx.pure.u64(quantityKg),
                    tx.pure.u64(priceScaled),
                    tx.pure.u64(deadlineTimestamp)
                ]
            });

            // 5. Serialize and "Send" to Gas Station
            const txBytes = await tx.build({ client });

            // 6. Get Sponsor Signature
            const sponsorSignature = await gasStationService.signTransaction(txBytes);

            // 7. Execute (Note: In a browser wallet context, we would now request the User to sign)
            // Since we don't have a real connected wallet in this snippets-only mode:
            console.log("Transaction built and sponsored!", {
                txDigest: "mock_digest_" + Date.now(),
                sponsorSignature
            });

            return {
                status: 'SUCCESS',
                digest: "mock_digest_" + Date.now(),
                contractId: "0xMockCreatedObjectId..."
            };

        } catch (error) {
            console.error("IOTA Transaction Failed:", error);
            throw error;
        }
    }
};
