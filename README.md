# BlockDew

BlockDew is a lightweight React app and Clarity contract that snapshots current Stacks transaction fee rates and lets the contract owner pause/unpause operations and set an on-chain fee value.

## Features

- Fetches live Stacks transfer fee rate from Hiro API
- Owner-only contract functions: `pause`, `unpause`, `set-fee`
- Read-only functions: `is-paused`, `get-fee`
- Wallet integration using `@stacks/connect` for contract calls

## Prerequisites

- Node.js 18+
- A Stacks wallet mnemonic with sufficient STX for deployment fees

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` (or copy `.env.example`) and fill values:

   - `MNEMONIC` — 12/24-word secret
   - `STACKS_NETWORK` — `mainnet` or `testnet`
   - `ACCOUNT_INDEX` — account index in the wallet (default `0`)

3. Run the app:

   ```bash
   npm run dev
   ```

   Open the UI and select the network. Connect your Stacks wallet and use `Pause`, `Unpause`, and `Set fee` actions.

## Contract

Path: `contracts/blockdew.clar`

- Owner principal is hardcoded: `'SP2QNSNKR3NRDWNTX0Q7R4T8WGBJ8RE8RA516AKZP`
- Functions:
  - `pause` — owner-only, sets `paused` to `true`
  - `unpause` — owner-only, sets `paused` to `false`
  - `set-fee (rate uint)` — owner-only, requires not paused
  - `is-paused` — returns current paused state
  - `get-fee` — returns current fee rate

## Deployment

Environment-driven deployment scripts are provided for both networks.

- Show derived address:

  ```bash
  node scripts/address.js
  ```

- Deploy to testnet:

  ```bash
  npm run deploy:testnet
  ```

- Deploy to mainnet:

  ```bash
  npm run deploy:mainnet
  ```

The script calculates an appropriate fee using Hiro `extended/v1/fee_rate`, sets the account nonce, and broadcasts the transaction. It prints the txid and an explorer link.

## Wallet Integration

- UI uses `@stacks/connect` `request('stx_callContract', ...)` with `contract: "<address>.<name>"`
- Clarity function arguments are hex-serialized values (e.g., `uintCV` via `serializeCV`)
- Read-only calls use Hiro `call-read` endpoints and decode results with `hexToCV`

## Troubleshooting

- "Not a valid contract" or "No contract source data found":
  - Wait for the deployment transaction to anchor and index; explorers and API endpoints may temporarily return empty results until confirmation.
- VM errors due to `contract-owner`:
  - The contract uses a hardcoded `OWNER` principal instead.
- Multiple wallet extensions:
  - The app forces wallet selection (`forceWalletSelect: true`) to pick the Stacks wallet.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — build production assets
- `npm run preview` — serve the built app locally
- `npm run lint` — run ESLint
- `npm run deploy:testnet` — deploy contract to testnet
- `npm run deploy:mainnet` — deploy contract to mainnet
- `node scripts/address.js` — print derived STX address

## Directory Structure

```
contracts/            # Clarity contracts
scripts/              # Deployment and address utilities
src/                  # React app source
public/               # Static assets (favicon, svg)
index.html            # App shell
README.md             # This file
```

## Security

- Keep `.env` out of version control (already in `.gitignore`).
- Never share your mnemonic or private keys.

