"use client"

import { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { SampleDataPoint } from '../lib/data'
import { fetcher } from '../lib/fetcher'
import { useToast } from './Toast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function ChartDemo() {
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const PAGE = 1
  const LIMIT = 10

  const { data = [], error, isValidating } = useSWR<SampleDataPoint[]>(`/api/sample?page=${PAGE}&limit=${LIMIT}`, fetcher)
  // show a user-friendly toast and inline message on fetch error (don't spam console)
  const [errorShown, setErrorShown] = useState(false)

  // Avoid updating state during render — run toast push in an effect when error appears
  useEffect(() => {
    if (error && !errorShown) {
      setErrorShown(true)
      // push toast after render
      toast.push({ text: (error as any)?.message || 'Failed to load data', type: 'error' })
    }
  }, [error, errorShown, toast])

  // reset error flag on successful data load so future failures show again
  useEffect(() => {
    if (!error) setErrorShown(false)
  }, [error])

  // isValidating is now destructured above; use it to show a small spinner while revalidating

  const labels = (data || []).map((d: SampleDataPoint) => d.label)
  const values = (data || []).map((d: SampleDataPoint) => d.value)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Value',
        data: values,
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.2)'
      }
    ]
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const v = Number(value)
    if (!label.trim() || Number.isNaN(v)) return
    setLoading(true)
    // optimistic update: add a temp item locally
    setLoading(true)
    const tempId = `temp:${Date.now()}`
    const optimisticItem: SampleDataPoint = { id: tempId, label: label.trim(), value: v }

    try {
      // update local cache optimistically
      await globalMutate(
        `/api/sample?page=${PAGE}&limit=${LIMIT}`,
        (current: SampleDataPoint[] = []) => [optimisticItem, ...current].slice(0, LIMIT),
        false
      )

      const created = await fetcher('/api/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), value: v })
      })

      // replace the optimistic item by revalidating (simpler) or patching
      await globalMutate(`/api/sample?page=${PAGE}&limit=${LIMIT}`)
      setLabel('')
      setValue('')
      toast.push({ text: 'Point created', type: 'success' })
    } catch (err: any) {
      console.error('Create failed', err)
      // rollback: revalidate to get authoritative data
      await globalMutate(`/api/sample?page=${PAGE}&limit=${LIMIT}`)
      toast.push({ text: err?.message || 'Failed to create point', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      {error && (
        <div role="alert" style={{ color: 'crimson', marginBottom: '1rem' }}>
          Failed to load data. <button onClick={() => globalMutate(`/api/sample?page=${PAGE}&limit=${LIMIT}`)}>Retry</button>
        </div>
      )}
      <div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input aria-label="label" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input aria-label="value" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
          <button type="submit" disabled={loading}>Add</button>
        </form>
        {/* global toast shows status; keep inline space for accessibility if needed */}
      </div>
      <div className="chart-wrap">
        {/* show spinner overlay while revalidating */}
        {isValidating && (
          <div className="chart-spinner" aria-hidden>
            <div className="spinner" />
          </div>
        )}
        <Line data={chartData} />
      </div>
    </div>
  )
}
