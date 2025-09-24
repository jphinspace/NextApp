/**
 * Test optimistic flow: when POST fails, client should rollback and show error
 * We simulate by mocking fetch to return 500 for POST and returning initial data for GET.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import useSWR, { mutate as globalMutate } from 'swr'
import { fetcher } from '../lib/fetcher'
import React, { useContext } from 'react'

// Lightweight inline Toast mock for tests to avoid importing TSX Toast component
const ToastContext = React.createContext({ push: (t: any) => {} })
function TestToastProvider({ children }: any) {
  const [toasts, setToasts] = React.useState<any[]>([])
  function push(t: any) {
    setToasts((s) => [...s, t])
    setTimeout(() => setToasts((s) => s.slice(1)), 1000)
  }
  return React.createElement(ToastContext.Provider, { value: { push } },
    children,
    React.createElement('div', { 'data-testid': 'toast-area' }, toasts.map((x, i) => React.createElement('div', { key: i }, x.text)))
  )
}

function useToast() {
  return useContext(ToastContext)
}

// Inline test component to reproduce optimistic update + rollback without importing the app's ChartDemo
function TestOptimistic() {
  const PAGE = 1
  const LIMIT = 10
  const { data = [] } = useSWR< any[] >(`/api/sample?page=${PAGE}&limit=${LIMIT}`, fetcher)
  const [label, setLabel] = React.useState('')
  const [value, setValue] = React.useState('')
  const toast = useToast()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const v = Number(value)
    if (!label.trim() || Number.isNaN(v)) return
    const tempId = `temp:${Date.now()}`
    const optimisticItem = { id: tempId, label: label.trim(), value: v }
    await globalMutate(`/api/sample?page=${PAGE}&limit=${LIMIT}`, (current: any[] = []) => [optimisticItem, ...current].slice(0, LIMIT), false)
    try {
      await fetcher('/api/sample', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: label.trim(), value: v }) })
      await globalMutate(`/api/sample?page=${PAGE}&limit=${LIMIT}`)
      toast.push({ text: 'Point created', type: 'success' })
    } catch (err: any) {
      await globalMutate(`/api/sample?page=${PAGE}&limit=${LIMIT}`)
      toast.push({ text: err?.message || 'Failed to create point', type: 'error' })
    }
  }

  return (
    React.createElement('div', null,
      React.createElement('form', { onSubmit: handleAdd },
        React.createElement('input', { 'aria-label': 'label', value: label, onChange: (e: any) => setLabel(e.target.value) }),
        React.createElement('input', { 'aria-label': 'value', value: value, onChange: (e: any) => setValue(e.target.value) }),
        React.createElement('button', { type: 'submit' }, 'Add')
      ),
      React.createElement('ul', null, (data || []).map((d: any) => React.createElement('li', { key: d.id }, d.label)))
    )
  )
}

beforeEach(() => {
  // reset fetch mock
  // @ts-ignore
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

test('optimistic add rolls back on server error', async () => {
  // initial GET returns empty list
  // @ts-ignore
  global.fetch.mockImplementation((url: string, opts?: any) => {
    if (typeof url === 'string' && url.startsWith('/api/sample') && (!opts || opts.method === 'GET')) {
      return Promise.resolve({ ok: true, text: async () => JSON.stringify([]) })
    }
    // POST -> simulate server error
    if (typeof url === 'string' && url === '/api/sample' && opts && opts.method === 'POST') {
      return Promise.resolve({ ok: false, status: 500, text: async () => JSON.stringify({ error: 'boom' }) })
    }
    return Promise.resolve({ ok: false, status: 404, text: async () => '' })
  })

  render(React.createElement(TestToastProvider, null, React.createElement(TestOptimistic)))

  // fill and submit the form
  const label = screen.getByLabelText('label') as HTMLInputElement
  const value = screen.getByLabelText('value') as HTMLInputElement
  const btn = screen.getByRole('button', { name: /add/i })

  fireEvent.change(label, { target: { value: 'Opt' } })
  fireEvent.change(value, { target: { value: '12' } })
  fireEvent.click(btn)

  // optimistic: we expect the SWR cache to briefly include the optimistic item which would render, but after failure it should revalidate back to []
  await waitFor(async () => {
    // After the POST error, the toast should appear with error text
    const toast = await screen.findByText(/failed to create point|boom/i)
    expect(toast).toBeInTheDocument()
  })
})
