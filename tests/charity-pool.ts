import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CharityPool } from "../target/types/charity_pool";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { assert } from "chai";

describe("charity-pool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CharityPool as Program<CharityPool>;

  const poolCreator = anchor.web3.Keypair.generate();

  console.log("Pool Creator", poolCreator.publicKey.toBase58());

  before(async () => {
    // Fund admin wallet
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        poolCreator.publicKey,
        100 * LAMPORTS_PER_SOL
      ),
      "confirmed"
    );
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Pool Created", async () => {
    await program.methods.createPool()
      .accounts({
        signer: poolCreator.publicKey,
      })
      .signers([poolCreator]).rpc();


  });
});
