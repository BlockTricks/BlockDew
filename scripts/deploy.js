import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import {
  makeContractDeploy,
  broadcastTransaction,
  PostConditionMode,
  TransactionVersion,
  getAddressFromPrivateKey,
} from '@stacks/transactions'
import { StacksMainnet, StacksTestnet } from '@stacks/network'
import { generateWallet } from '@stacks/wallet-sdk'

async function main() {
  const mnemonic = globalThis.process?.env?.MNEMONIC
  const networkName = (globalThis.process?.env?.STACKS_NETWORK || 'testnet').toLowerCase()
  const accountIndex = Number(globalThis.process?.env?.ACCOUNT_INDEX || 0)
  if (!mnemonic) throw new Error('MNEMONIC is required in environment')

  const network = networkName === 'mainnet' ? new StacksMainnet() : new StacksTestnet()
  const baseUrl = networkName === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so'

  const wallet = await generateWallet({ secretKey: mnemonic, password: 'unused' })
  const account = wallet.accounts[accountIndex]
  if (!account) throw new Error(`Account index ${accountIndex} not found`)
  const senderKey = account.stxPrivateKey
  const version = networkName === 'mainnet' ? TransactionVersion.Mainnet : TransactionVersion.Testnet
  const senderAddress = getAddressFromPrivateKey(senderKey, version)

  const codeBody = fs.readFileSync(path.join(globalThis.process.cwd(), 'contracts', 'blockdew.clar'), 'utf8')

  const nonceRes = await fetch(`${baseUrl}/v2/accounts/${senderAddress}`)
  const nonceJson = await nonceRes.json()
  const nonce = BigInt(nonceJson.nonce ?? 0)

  const draft = await makeContractDeploy({
    contractName: 'blockdew',
    codeBody,
    senderKey,
    nonce,
    fee: 1n,
    network,
    postConditionMode: PostConditionMode.Deny,
  })

  const serializedHex = globalThis.Buffer.from(draft.serialize()).toString('hex')
  const frRes = await fetch(`${baseUrl}/extended/v1/fee_rate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ transaction: serializedHex }),
  })
  const frJson = await frRes.json()
  const feeRate = typeof frJson === 'number' ? frJson : frJson.fee_rate ?? frJson.estimated_fee_rate
  if (!feeRate) throw new Error('Failed to fetch fee rate')
  const txSize = globalThis.Buffer.from(draft.serialize()).byteLength
  const fee = BigInt(feeRate * txSize)

  const tx = await makeContractDeploy({
    contractName: 'blockdew',
    codeBody,
    senderKey,
    nonce,
    fee,
    network,
    postConditionMode: PostConditionMode.Deny,
  })

  const result = await broadcastTransaction(tx, network)
  const txId = typeof result === 'string' ? result : result.txid || result.txId
  if (!txId) throw new Error(`Broadcast failed: ${JSON.stringify(result)}`)
  console.log('Deployed contract txid:', txId)
  const explorer = networkName === 'mainnet'
    ? `https://explorer.hiro.so/txid/${txId}?chain=mainnet`
    : `https://explorer.hiro.so/txid/${txId}?chain=testnet`
  console.log('Explorer:', explorer)
}

main().catch((e) => {
  console.error(e)
  globalThis.process.exit(1)
})
