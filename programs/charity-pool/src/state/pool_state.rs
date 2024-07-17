use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    pub title: String,
    pub description: String,
    pub deadline: u64,
}

#[account]
pub struct Contribution {
    pub pool_pubkey: Pubkey,
    pub contributor: Pubkey,
    pub amount_contributed: u32, // TODO: define amount unit -> SOL or Lamports
}

#[account]
pub struct Contributor {
    pub contributions: Vec<Contribution>,
}
