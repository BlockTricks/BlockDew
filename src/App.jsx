import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [network, setNetwork] = useState('mainnet')
  const [feeRate, setFeeRate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [threshold, setThreshold] = useState(300)

  const baseUrl = network === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so'

  const isGoodTime = useMemo(() => {
    if (feeRate == null) return null
    return feeRate <= Number(threshold)
  }, [feeRate, threshold])

  const tiers = useMemo(() => {
    if (feeRate == null) return null
    const low = Math.max(1, Math.round(feeRate * 0.8))
    const avg = Math.round(feeRate)
    const high = Math.round(feeRate * 1.2)
    return { low, avg, high }
  }, [feeRate])

  useEffect(() => {
    const fetchFee = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${baseUrl}/v2/fees/transfer`, { headers: { Accept: 'application/json' } })
        const text = await res.text()
        let rate
        try {
          const json = JSON.parse(text)
          rate = typeof json === 'number' ? json : json.fee_rate ?? json.estimated_fee_rate ?? null
        } catch {
          const n = Number(String(text).replace(/[^0-9.]/g, ''))
          rate = Number.isFinite(n) ? n : null
        }
        if (rate == null) throw new Error('Unable to parse fee rate')
        setFeeRate(rate)
      } catch {
        setError('Failed to load fee rate')
        setFeeRate(null)
      } finally {
        setLoading(false)
      }
    }
    fetchFee()
  }, [baseUrl])

  return (
    <div className="container">
      <h1>BlockDew</h1>
      <p className="subtitle">Stacks transaction fee snapshot</p>

      <div className="controls">
        <label className={network === 'mainnet' ? 'active' : ''}>
          <input type="radio" name="network" value="mainnet" checked={network === 'mainnet'} onChange={() => setNetwork('mainnet')} />
          Mainnet
        </label>
        <label className={network === 'testnet' ? 'active' : ''}>
          <input type="radio" name="network" value="testnet" checked={network === 'testnet'} onChange={() => setNetwork('testnet')} />
          Testnet
        </label>
        <div className="threshold">
          <span>Alert threshold</span>
          <input type="number" min="1" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
        </div>
        <button className="refresh" onClick={() => setNetwork((n) => n)} disabled={loading}>Refresh</button>
      </div>

      <div className="panel">
        {loading && <div className="status">Loading…</div>}
        {error && <div className="status error">{error}</div>}
        {!loading && !error && feeRate != null && (
          <div className="grid">
            <div className="tile">
              <div className="label">Current fee rate</div>
              <div className="value">{feeRate}</div>
              <div className={`badge ${isGoodTime ? 'good' : 'bad'}`}>{isGoodTime ? 'Good time' : 'Busy time'}</div>
            </div>
            {tiers && (
              <>
                <div className="tile">
                  <div className="label">Low</div>
                  <div className="value">{tiers.low}</div>
                </div>
                <div className="tile">
                  <div className="label">Avg</div>
                  <div className="value">{tiers.avg}</div>
                </div>
                <div className="tile">
                  <div className="label">High</div>
                  <div className="value">{tiers.high}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="footnote">Data: {baseUrl}/v2/fees/transfer</div>
    </div>
  )
}

export default App
