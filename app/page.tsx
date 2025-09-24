import ChartDemo from '../components/ChartDemo'

export default function Page() {
  return (
    <section>
      <h1 className="title">Sample Data Visualization</h1>
      <p className="muted">This page reads from an in-memory store and displays a chart.</p>
      <ChartDemo />
    </section>
  )
}
