export const metadata = { title: 'Offline' };
export default function Offline() {
  return (
    <main className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <img src="/icon.svg" className="h-14 w-14 mx-auto mb-4" alt="Kaizen" />
        <h1 className="text-xl font-bold">You are offline</h1>
        <p className="text-ink-600 mt-2">Reconnect to sync your progress. Your streak is safe.</p>
      </div>
    </main>
  );
}
