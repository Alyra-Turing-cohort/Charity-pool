import { getProgramById } from "./ProgramHelper";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";

export const createPool = async (title: string,
    initialFunding: number,
    connection: anchor.web3.Connection,
    wallet): string => {

    // get the program
    const program = getProgramById(connection, wallet);

    const donationKeypair = Keypair.generate();

    // get the pool PDA address
    const [poolPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"),
        wallet.publicKey.toBuffer(),
        donationKeypair.publicKey.toBuffer()],
        program.programId
    );

    const tx = await program.methods.createPool(title,
        donationKeypair.publicKey,
        new anchor.BN(initialFunding * LAMPORTS_PER_SOL))
        .accounts({
            pool: poolPda,
            donation: donationKeypair.publicKey,
            creator: wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    return tx;
}

export const getPools = async (connection: anchor.web3.Connection, wallet) => {
    // get the program
    const program = getProgramById(connection, wallet);
    const poolList = await program.account.pool.all();
    return poolList;
}

export const contributeToPool = async (connection: anchor.web3.Connection,
    wallet,
    pool,
    contributionAmount: number): string => {
    // get the program
    const program = getProgramById(connection, wallet);

    // get the pool PDA address
    const [poolPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"),
        pool.creator.toBuffer(),
        pool.donationPubkey.toBuffer()],
        program.programId
    );

    // get the vault PDA address
    const [poolVaultPda, poolVaultBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_vault"), poolPda.toBuffer()],
        program.programId
    );

    const tx = await program.methods
        .contribute(new anchor.BN(contributionAmount * LAMPORTS_PER_SOL))
        .accounts({
            pool: poolPda,
            creator: pool.creator,
            contributor: wallet.publicKey,
            donation: pool.donationPubkey,
            poolVault: poolVaultPda,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    return tx;
}

export const drawWinner = async (connection: anchor.web3.Connection, wallet, pool): string => {
    // get the program
    const program = getProgramById(connection, wallet);

    // get the pool PDA address
    const [poolPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"),
        pool.creator.toBuffer(),
        pool.donationPubkey.toBuffer()],
        program.programId
    );

    const tx = await program.methods
        .drawWinner()
        .accounts({
            pool: poolPda,
            creator: pool.creator,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    return tx;
}

export const getRewardedPools = async (connection: anchor.web3.Connection, wallet) => {
    // get the program
    const program = getProgramById(connection, wallet);
    const poolList = await program.account.pool.all();

    // filter the pools that have the winner is not null
    const poolsHavingAWinner = poolList.filter(pool => pool.account.winner !== null);

    if (poolsHavingAWinner) {
        // filter the pools that have the winner is the same as wallet.publicKey
        const rewardedPools = poolsHavingAWinner.filter(pool => pool.account.winner.toBase58() === wallet.publicKey.toBase58());

        return rewardedPools;
    }
    return [];
}

export const distributeFunds = async (connection: anchor.web3.Connection,
    wallet,
    pool): string => {
    // get the program
    const program = getProgramById(connection, wallet);

    // get the pool PDA address
    const [poolPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"),
        pool.creator.toBuffer(),
        pool.donationPubkey.toBuffer()],
        program.programId
    );

    // get the vault PDA address
    const [poolVaultPda, poolVaultBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool_vault"), poolPda.toBuffer()],
        program.programId
    );

    const tx = await program.methods
        .distributeFunds()
        .accounts({
            pool: poolPda,
            poolVault: poolVaultPda,
            providedWinner: pool.winner,
            creator: pool.creator,
            donation: pool.donationPubkey,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    return tx;
}
