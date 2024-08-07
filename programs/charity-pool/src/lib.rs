pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8Wc1xYfxnGmqs7u7bR4xNa1uvBV8eNpVHN4NWU4xebFs");

#[program]
pub mod charity_pool {
    use super::*;

    pub fn create_pool(ctx: Context<CreatePool>, pool_name: String, donation_pubkey: Pubkey, initial_funding: u64) -> Result<()> {
        create_pool::handler(ctx, pool_name, donation_pubkey, initial_funding)
    }

    pub fn distribute_funds(ctx: Context<DistributeFunds>) -> Result<()> {
        distribute_funds::handler(ctx)
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        contribute::handler(ctx, amount)
    }
    pub fn draw_winner(ctx: Context<DrawWinner>) -> Result<()> {
        draw_winner::handler(ctx)
    }
}
