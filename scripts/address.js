import 'dotenv/config'
import { generateWallet } from '@stacks/wallet-sdk'
import { getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions'

async function main() {
  const mnemonic = process.env.MNEMONIC
  const networkName = (process.env.STACKS_NETWORK || 'testnet').toLowerCase()
  const accountIndex = Number(process.env.ACCOUNT_INDEX || 0)
  if (!mnemonic) throw new Error('MNEMONIC is required in environment')

  const wallet = await generateWallet({ secretKey: mnemonic, password: 'unused' })
  const account = wallet.accounts[accountIndex]
  if (!account) throw new Error(`Account index ${accountIndex} not found`)

  const version = networkName === 'mainnet' ? TransactionVersion.Mainnet : TransactionVersion.Testnet
  const address = getAddressFromPrivateKey(account.stxPrivateKey, version)
  console.log('Network:', networkName)
  console.log('Account index:', accountIndex)
  console.log('Derived STX address:', address)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
