import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CharityPool } from "../target/types/charity_pool";
import {
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Keypair
} from "@solana/web3.js";
import { assert } from "chai";

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
        [Buffer.from("pool_vault"), poolPda.toBuffer()],
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

    /**
     * Pool creation test
     * */
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

        const contributions = poolAccount.contributions;
        assert.ok(contributions.length > 0, "Initial contrib should be recorded");
    });

    it("Create Pool with Missing Fields", async () => {
        try {
            await program.methods.createPool("",
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

        } catch (error) {
            assert.ok(error, "Should throw error for empty pool name");
        }
    });

    /**
     * Contribution test
     * */

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

    it("Multiple Contributions", async () => {
        const NUM_CONTRIBUTORS = 10;
        const contributors = [];

        // Create the required number of contributors and airdrop some SOL to them
        for (let i = 0; i < NUM_CONTRIBUTORS; i++) {
            const contributor = Keypair.generate();
            contributors.push(contributor);

            await provider.connection.confirmTransaction(
                await provider.connection.requestAirdrop(
                    contributor.publicKey,
                    10 * LAMPORTS_PER_SOL // Assuming each contributor gets 10 SOL for the test
                ),
                "confirmed"
            );
        }

        const contributionAmount = new anchor.BN(CONTRIBUTION_AMOUNT + 1);

        for (const contributor of contributors) {
            await program.methods.contribute(contributionAmount)
                .accounts({
                    pool: poolPda,
                    creator: poolCreator.publicKey,
                    contributor: contributor.publicKey,
                    donation: donationKeypair.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([contributor])
                .rpc();
        }

        const poolAccount = await program.account.pool.fetch(poolPda);
        const contributions = poolAccount.contributions;
        assert.ok(contributions.length >= NUM_CONTRIBUTORS, `There should be at least ${NUM_CONTRIBUTORS} contributions recorded.`);
    });

    it("Contributes with Insufficient Funds", async () => {
        const insufficientContributorKeypair = Keypair.generate();
        await provider.connection.requestAirdrop(insufficientContributorKeypair.publicKey, 0.5 * LAMPORTS_PER_SOL);

        const contributionAmount = new anchor.BN(CONTRIBUTION_AMOUNT);

        try {
            await program.methods.contribute(contributionAmount)
                .accounts({
                    pool: poolPda,
                    creator: poolCreator.publicKey,
                    contributor: insufficientContributorKeypair.publicKey,
                    donation: donationKeypair.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([insufficientContributorKeypair])
                .rpc();
        } catch (error) {
            assert.ok(error, "Should throw an error for insufficient funds");
        }
    });

    it("Negative Contribution Amount", async () => {
        const negativeContributionAmount = new anchor.BN(-CONTRIBUTION_AMOUNT);

        try {
            await program.methods.contribute(negativeContributionAmount)
                .accounts({
                    pool: poolPda,
                    creator: poolCreator.publicKey,
                    contributor: contributorKeypair.publicKey,
                    donation: donationKeypair.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([contributorKeypair])
                .rpc();
        } catch (error) {
            assert.ok(error, "Should throw an error for negative contribution amounts");
        }
    });


    /**
     * Pre-drwaing distribution test
     * */
    it("Distributes funds without drawing winner", async () => {
        try {
            await program.methods.distributeFunds()
                .accounts({
                    pool: poolPda,
                    poolVault: poolVaultPda,
                    providedWinner: contributorKeypair.publicKey,
                    creator: poolCreator.publicKey,
                    donation: donationKeypair.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([contributorKeypair])
                .rpc();
        } catch (error) {
            assert.ok(error, "Should throw an error if no winner has been drawn");
        }
    });


    /**
     * Drawing
     * */
    it("Draw Winner Before Pool Ends", async () => {
        try {
            await program.methods.drawWinner()
                .accounts({
                    pool: poolPda,
                    creator: poolCreator.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([poolCreator])
                .rpc();
        } catch (error) {
            assert.ok(error, "Should throw an error if pool has not ended");
        }
    });

    it("Draw Winner", async () => {
        await program.methods.drawWinner()
            .accounts({
                pool: poolPda,
                creator: poolCreator.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([poolCreator])
            .rpc();

        const poolAccount = await program.account.pool.fetch(poolPda);
        assert.isNotNull(poolAccount.winner, "Winner should be drawn");
    });

    /**
     * Distribution test
     *
     * */
    // it("Verify Pool Vault Balance", async () => {
    //     const preDistributionBalance = await provider.connection.getBalance(poolVaultPda);
    //     assert.ok(preDistributionBalance > 0, "Pool vault should have a positive balance before distribution");
    //
    //     await program.methods.distributeFunds()
    //         .accounts({
    //             pool: poolPda,
    //             poolVault: poolVaultPda,
    //             providedWinner: contributorKeypair.publicKey,
    //             creator: poolCreator.publicKey,
    //             donation: donationKeypair.publicKey,
    //             systemProgram: SystemProgram.programId,
    //         })
    //         .signers([contributorKeypair])
    //         .rpc();
    //
    //     const postDistributionBalance = await provider.connection.getBalance(poolVaultPda);
    //     assert.equal(postDistributionBalance, 0, "Pool vault balance should be zero after distribution");
    // });
    it("Distributes funds", async () => {
        // Draw winner
        await program.methods.drawWinner()
            .accounts({
                pool: poolPda,
                creator: poolCreator.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([poolCreator])
            .rpc();

        const poolAccount = await program.account.pool.fetch(poolPda);
        const contributions = poolAccount.contributions;

        assert.isNotNull(poolAccount.winner, "Winner should be drawn");
        assert.ok(contributions.length > 0, "Contributions should be recorded");
        assert.isTrue(poolAccount.claimed === false, "Pool should not be claimed");

        const contribution = contributions.find(
            (c: any) => c.contributor.toBase58() === contributorKeypair.publicKey.toBase58()
        );
        assert.ok(contribution, "Contribution should exist");

        console.log("Winner drawn: ", poolAccount.winner);
        console.log("Contribution recorded in pool: ", poolAccount.contributions);

        console.log("Contributor : ", contributorKeypair.publicKey.toBase58());
        console.log("Pool Winner: ", poolAccount.winner.toBase58());

        await program.methods.distributeFunds()
            .accounts({
                pool: poolPda,
                poolVault: poolVaultPda,
                providedWinner: contributorKeypair.publicKey,
                // providedWinner: poolAccount.winner,
                creator: poolCreator.publicKey,
                donation: donationKeypair.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([contributorKeypair])
            .rpc();

        console.log("Funds distributed, fetching pool account...");

        // Fetch the pool account to verify distribution
        const updatedPoolAccount = await program.account.pool.fetch(poolPda);
        const updatedContributions = updatedPoolAccount.contributions;

        console.log("Updated pool contributions: ", updatedContributions);

        assert.isTrue(updatedPoolAccount.claimed === true, "Pool should be claimed");

        const creatorBalance = await provider.connection.getBalance(poolCreator.publicKey);
        const donationBalance = await provider.connection.getBalance(donationKeypair.publicKey);

        console.log("Creator Balance: ", creatorBalance);
        console.log("Donation Balance: ", donationBalance);

        assert.ok(creatorBalance > 0, "Creator should have received funds.");
        assert.ok(donationBalance > 0, "Donation should have received funds.");

        console.log("Funds distributed successfully.");
    });

    it("Pool Already Claimed", async () => {
        const updatedPoolAccount = await program.account.pool.fetch(poolPda);
        assert.isTrue(updatedPoolAccount.claimed, "Pool should be marked as claimed");

        // Attempt to distribute funds again which should fail
        try {
            await program.methods.distributeFunds()
                .accounts({
                    pool: poolPda,
                    poolVault: poolVaultPda,
                    providedWinner: poolAccount.winner,
                    creator: poolCreator.publicKey,
                    donation: donationKeypair.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([contributorKeypair])
                .rpc();
        } catch (error) {
            assert.ok(error, "Should throw an error if trying to distribute funds for already claimed pool");
        }
    });

});
