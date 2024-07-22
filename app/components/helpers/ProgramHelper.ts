import * as anchor from "@coral-xyz/anchor";
import charityPoolIdl from '../../../target/idl/charity_pool.json';

export const getProgramById = (connection: anchor.web3.Connection, wallet): anchor.Program => {
    
    let provider: anchor.Provider;
    try {
      provider = new anchor.AnchorProvider(connection, wallet, {});
    } catch {
      provider = anchor.getProvider();
    }
    anchor.setProvider(provider);
    const program = new anchor.Program(charityPoolIdl as anchor.Idl, provider);
    return program;
}
