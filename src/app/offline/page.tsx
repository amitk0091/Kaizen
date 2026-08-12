export default function Offline() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
      <div>
        <div style={{ fontSize: 40 }}>🌿</div>
        <h1 style={{ marginTop: 12 }}>You're offline</h1>
        <p style={{ color: "var(--text-2)" }}>Kaizen keeps your entries saved on this device and will sync when you reconnect.</p>
      </div>
    </div>
  );
}
