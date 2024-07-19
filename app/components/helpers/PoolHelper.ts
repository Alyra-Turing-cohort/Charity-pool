import { getProgramById } from "./ProgramHelper";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

export const createPool = async (title: string,
    initialFunding: number,
    connection: anchor.web3.Connection,
    wallet) => {

    // get the program
    const program = getProgramById(connection, wallet);

    const donationKeypair = Keypair.generate();

    console.log("program id", program.programId.toBase58());
    console.log("system program id", SystemProgram.programId.toBase58());

    // get the PDA address
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

    console.log('tx', tx);
}
