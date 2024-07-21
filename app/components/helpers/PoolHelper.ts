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
        new anchor.BN(initialFunding))
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

    console.log('poolPda', poolPda.toBase58());

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