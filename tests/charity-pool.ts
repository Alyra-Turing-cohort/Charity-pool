import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CharityPool } from "../target/types/charity_pool";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Keypair,
  Transaction,
  TransactionInstruction,
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

    // Verify pool creation
    const poolAccount = await program.account.pool.fetch(poolPda);
    assert.ok(poolAccount, "Pool account should exist");
    console.log("Pool account: ", poolAccount);

  });

   it("Contribute to Pool", async () => {
      const contributor = Keypair.generate();

      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          contributor.publicKey,
          10 * LAMPORTS_PER_SOL
        ),
        "confirmed"
      );

      const contributeInstruction = new TransactionInstruction({
        keys: [
          { pubkey: poolPda, isSigner: false, isWritable: true },
          { pubkey: contributor.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: program.programId,
        data: Buffer.from([]), // Add any necessary data as per your contribute function definition
      });

      const transaction = new Transaction().add(contributeInstruction);
      await provider.sendAndConfirm(transaction, [contributor]);

      // Verify contribution
      const poolAccountAfterContribution = await program.account.pool.fetch(poolPda);
      assert.ok(poolAccountAfterContribution.contributions.length > 0, "There should be at least one contribution");
      console.log("Pool account contributions: ", poolAccountAfterContribution.contributions);
    });

});
