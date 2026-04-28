export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Polkadot Activity Feed
      </h1>
      <p className="mb-8 text-gray-400">
        Real-time events across Polkadot parachains
      </p>
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
        Feed loading...
      </div>
    </main>
  );
}
