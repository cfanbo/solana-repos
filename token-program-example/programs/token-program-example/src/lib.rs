use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
    Metadata,
};

use anchor_spl::token_interface::{
    self, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked,
};

use mpl_token_metadata::{
    instructions::CreateV1Builder,
    instructions::CreateV1CpiBuilder,
    types::{PrintSupply, TokenStandard},
};

// https://www.anchor-lang.com/docs/tokens/basics
// https://github.com/solana-developers/program-examples/tree/main/tokens/token-2022

declare_id!("DtZTAv7NBZyzq6L3K3dS1YzBFhMcu97855QcmFieSdHn");

#[program]
pub mod token_program_example {
    use super::*;

    // 创建代币Token
    pub fn create_mint(
        ctx: Context<CreateMint>,
        token_name: String,
        token_symbol: String,
        token_uri: String,
    ) -> Result<()> {
        msg!("Creating metadata account");

        msg!(
            "token_metadata_program address: {:?}",
            ctx.accounts.token_metadata_program.key()
        );

        const limitSupply: u64 = 100000;
        // Cross Program Invocation (CPI)
        // https://developers.metaplex.com/token-metadata/token-2022   https://developers.metaplex.com/token-metadata/mint
        CreateV1CpiBuilder::new(&ctx.accounts.token_metadata_program)
            .metadata(&ctx.accounts.metadata_account.to_account_info())
            .mint(&ctx.accounts.mint.to_account_info(), true)
            .authority(&ctx.accounts.signer)
            .payer(&ctx.accounts.signer)
            .update_authority(&ctx.accounts.signer, true)
            .system_program(&ctx.accounts.system_program)
            .sysvar_instructions(&ctx.accounts.rent.to_account_info())
            .spl_token_program(Some(&ctx.accounts.token_program)) // here
            .token_standard(mpl_token_metadata::types::TokenStandard::Fungible)
            .seller_fee_basis_points(0) //
            .print_supply(mpl_token_metadata::types::PrintSupply::Limited(limitSupply))
            .name(token_name)
            .symbol(token_symbol)
            .uri(token_uri)
            // .decimals(6)
            .invoke()?;

        msg!("Token created successfully.");

        Ok(())
    }

    // 创建 tokenAccount
    pub fn create_token_account(ctx: Context<CreateTokenAccount>) -> Result<()> {
        msg!(
            "Created Token Account: {:?}",
            ctx.accounts.token_account.key()
        );
        Ok(())
    }

    // 给账户铸造代币
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts); // .with_signer(signer_seeds);

        token_interface::mint_to(cpi_context, amount)?;
        Ok(())
    }

    // 转账
    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        // Get the number of decimals for this mint
        let decimals = ctx.accounts.mint.decimals;

        // Create the TransferChecked struct with required accounts
        let cpi_accounts = TransferChecked {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };

        // The program being invoked in the CPI
        let cpi_program = ctx.accounts.token_program.to_account_info();

        // Combine the accounts and program into a "CpiContext"
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        // Make CPI to transfer_checked instruction on token program
        token_interface::transfer_checked(cpi_context, amount, decimals)?;
        Ok(())
    }

    pub fn token_program(ctx: Context<TokenProgram>) -> Result<()> {
        msg!(
            "Mint account program owner: {:?}",
            ctx.accounts.mint.to_account_info().owner
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        mint::decimals = 6,
        mint::authority = signer.key(),
        mint::freeze_authority = signer.key(),
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Validate address by deriving pda
    #[account(
        mut,
        seeds = [b"metadata", token_metadata_program.key().as_ref(), mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata_account: UncheckedAccount<'info>,

    pub token_metadata_program: Program<'info, Metadata>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateTokenAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program,
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    // The source token account owner
    #[account(mut)]
    pub signer: Signer<'info>,
    // The mint account specifying the type of token
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    // The source token account to transfer tokens from
    #[account(mut)]
    pub sender_token_account: InterfaceAccount<'info, TokenAccount>,
    // The destination token account to receive tokens
    #[account(mut)]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,
    // The token program that will process the transfer
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct TokenProgram<'info> {
    #[account(
        mint::token_program = token_program
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}
