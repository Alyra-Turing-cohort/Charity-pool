use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace, Debug)]
pub struct Pool {
    #[max_len(32)]
    pub name: String,
    pub donation_pubkey: Pubkey,
    pub creator: Pubkey,
    pub deadline: u64,
    #[max_len(64)]
    pub contributions: Vec<Contribution>,
}

impl Pool {
    pub const INIT_SPACE: usize = 8 + 4 + (32 * 2) + 8 + (8 + 64 * (32 + 8)); // adjust the space calculation if necessary

    pub fn new(name: String, donation_pubkey: Pubkey, creator: Pubkey) -> Result<Self> {
        let current_timestamp = Clock::get()?.unix_timestamp;
        let duration = 5 * 60;

        Ok(Pool {
            name,
            donation_pubkey,
            creator,
            deadline: (current_timestamp as u64).checked_add(duration).unwrap(),
            contributions: Vec::new(),
        })
    }
}

#[account]
#[derive(Debug, InitSpace)]
pub struct Contribution {
    pub contributor: Pubkey,
    pub amount: u64,
}
