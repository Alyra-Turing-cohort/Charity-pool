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

  const POOL_INITIAL_FUNDING = 1 * 10 ** LAMPORTS_PER_SOL;
  const poolCreator = anchor.web3.Keypair.generate();
  const donationKeypair = anchor.web3.Keypair.generate();

  //seeds = [b"pool".as_ref(), creator.key().as_ref(), &params.donation_pubkey.to_bytes()],

  const [poolPda,] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), poolCreator.publicKey.toBuffer(), donationKeypair.publicKey.toBuffer()],
    program.programId
  );
  console.log("Pool Creator:", poolCreator.publicKey.toBase58());
  console.log("Donation Pubkey:", donationKeypair.publicKey.toBase58());
  console.log("Pool PDA:", poolPda.toBase58());

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
    const createPoolParams = {
      //pool_name: "Test Pool",
      //donation_pubkey: donationKeypair.publicKey,
      initial_funding: POOL_INITIAL_FUNDING,
    }

    await program.methods.createPool(createPoolParams)
      .accountsStrict({
        pool: poolPda,
        donation: donationKeypair.publicKey,
        creator: poolCreator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([poolCreator]).rpc();


  });
});
