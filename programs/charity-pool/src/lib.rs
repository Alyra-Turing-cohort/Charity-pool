pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("Hnnm5AJZQR8j6r6PcPSg3sZZHbLNS2Ta7qnc8zwZAbeR");

#[program]
pub mod charity_pool {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn create_pool(ctx: Context<CreatePool>, params: CreatePoolParams) -> Result<()> {
        create_pool::handler(ctx, params)
    }
}
