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
    pub winner: Option<Pubkey>,
    pub claimed: bool,
    pub total_contributions: u64,
}

impl Pool {
    pub fn new(name: String, donation_pubkey: Pubkey, creator: Pubkey, initial_funding: u64) -> Result<Self> {
        let current_timestamp = Clock::get()?.unix_timestamp;
        let duration = 5 * 60;
        let initial_contrib = Contribution { contributor: creator, amount: initial_funding };

        Ok(Pool {
            name,
            donation_pubkey,
            creator,
            deadline: (current_timestamp as u64).checked_add(duration).unwrap(),
            contributions: vec![initial_contrib],
            total_contributions: initial_funding,
            winner: None,
            claimed: false,
        })
    }

    pub fn add_contribution(&mut self, contributor: Pubkey, amount: u64) -> Result<()> {
        self.total_contributions = self.total_contributions.checked_add(amount).unwrap();
        self.contributions.push(Contribution { contributor, amount });
        Ok(())
    }

    pub fn draw_winner(&mut self) -> Result<()> {
        // self.winner = simulate_vrf(pool.contributions.len());
        self.winner = Some(self.contributions[1].contributor);
        Ok(())
    }

    pub fn is_ended(&self, current_timestamp: u64) -> bool {
        self.deadline <= current_timestamp
    }
}

#[account]
#[derive(Debug, InitSpace)]
pub struct Contribution {
    pub contributor: Pubkey,
    pub amount: u64,
}
