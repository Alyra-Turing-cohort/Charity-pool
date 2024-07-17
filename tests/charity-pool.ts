import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {CharityPool} from "../target/types/charity_pool";
import {
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Keypair
} from "@solana/web3.js";
import {assert} from "chai";

describe("charity-pool", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.CharityPool as Program<CharityPool>;

    const POOL_INITIAL_FUNDING = 1 * LAMPORTS_PER_SOL;
    const CONTRIBUTION_AMOUNT = 1 * LAMPORTS_PER_SOL;

    const poolCreator = Keypair.generate();
    const donationKeypair = Keypair.generate();
    const contributorKeypair = Keypair.generate();

    //seeds = [b"pool".as_ref(), creator.key().as_ref(), &params.donation_pubkey.to_bytes()],

    const [poolPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), poolCreator.publicKey.toBuffer(), donationKeypair.publicKey.toBuffer()],
        program.programId
    );

    const [poolVaultPda, poolVaultBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_vault"), poolCreator.publicKey.toBuffer(), poolPda.toBuffer()],
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

        await provider.connection.confirmTransaction(
            await provider.connection.requestAirdrop(
                contributorKeypair.publicKey,
                10 * LAMPORTS_PER_SOL
            ),
            "confirmed"
        );

        await provider.connection.confirmTransaction(
            await provider.connection.requestAirdrop(
                poolVaultPda,
                2 * LAMPORTS_PER_SOL,
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
            pool_name: "Test Pool",
            donation_pubkey: donationKeypair.publicKey,
            initial_funding: new anchor.BN(POOL_INITIAL_FUNDING),
        }

        await program.methods.createPool("Test Pool",
            donationKeypair.publicKey,
            new anchor.BN(POOL_INITIAL_FUNDING)
        )
            .accounts({
                pool: poolPda,
                donation: donationKeypair.publicKey,
                creator: poolCreator.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([poolCreator])
            .rpc();

        // Verify pool creation
        const poolAccount = await program.account.pool.fetch(poolPda);
        assert.ok(poolAccount, "Pool account should exist");
        assert.equal(poolAccount.name, createPoolParams.pool_name, "Pool name should match");
        assert.equal(poolAccount.donationPubkey.toBase58(), donationKeypair.publicKey.toBase58(), "Donation pubkey should match");
        console.log("Pool account: ", poolAccount);

    });

    it("Contributes to the Pool", async () => {
        const contributionAmount = new anchor.BN(CONTRIBUTION_AMOUNT);

        console.log("Starting contribution...");

        await program.methods.contribute(contributionAmount)
            .accounts({
                pool: poolPda,
                creator: poolCreator.publicKey,
                contributor: contributorKeypair.publicKey,
                donation: donationKeypair.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([contributorKeypair])
            .rpc();

        console.log("Contribution done, fetching pool account...");


        const poolAccount = await program.account.pool.fetch(poolPda);
        const contributions = poolAccount.contributions;


        assert.ok(contributions.length > 0, "Contributions should be recorded");

        const contribution = contributions.find(
            (c: any) => c.contributor.toBase58() === contributorKeypair.publicKey.toBase58()
        );
        assert.ok(contribution, "Contribution should exist");
        assert.equal(contribution.amount.toString(), contributionAmount.toString(), "Contribution amount should match");

        console.log("Contribution recorded in pool: ", poolAccount.contributions);
    });

    it("Distributes funds", async () => {

        const poolAccount = await program.account.pool.fetch(poolPda);
        const contributions = poolAccount.contributions;

        assert.ok(contributions.length > 0, "Contributions should be recorded");

        const contribution = contributions.find(
            (c: any) => c.contributor.toBase58() === contributorKeypair.publicKey.toBase58()
        );
        assert.ok(contribution, "Contribution should exist");

        console.log("Contribution recorded in pool: ", poolAccount.contributions);

        await program.methods.distributeFunds()
            .accounts({
                pool: poolPda,
                creator: poolCreator.publicKey,
                poolVault: poolVaultPda,
                donation: donationKeypair.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([poolCreator])
            .rpc();

        console.log("Funds distributed, fetching pool account...");

        // Fetch the pool account to verify distribution
        const updatedPoolAccount = await program.account.pool.fetch(poolPda);
        const updatedContributions = updatedPoolAccount.contributions;

        console.log("Updated pool contributions: ", updatedContributions);

        const creatorBalance = await provider.connection.getBalance(poolCreator.publicKey);
        const donationBalance = await provider.connection.getBalance(donationKeypair.publicKey);

        console.log("Creator Balance: ", creatorBalance);
        console.log("Donation Balance: ", donationBalance);

        assert.ok(creatorBalance > 0, "Creator should have received funds.");
        assert.ok(donationBalance > 0, "Donation should have received funds.");

        console.log("Funds distributed successfully.");
    });


});
