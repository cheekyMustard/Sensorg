export default function Home() {
  return (
    <div className="pb-16">
      <div className="max-w-md mx-auto mt-4 space-y-4">
        <div className="bg-base p-4 border-2 border-primary rounded">
          <h2 className="font-bold text-neutral mb-2">🚚 Delivery Requests</h2>
          <p className="text-neutral">Offene Lieferanfragen zwischen Shops</p>
        </div>
        <div className="bg-base p-4 rounded">
          <h2 className="font-bold text-neutral mb-2">📝 Notes</h2>
          <p className="text-neutral">To-Dos, Hinweise vom Shop-Team</p>
        </div>
        <div className="bg-base p-4 rounded">
          <h2 className="font-bold text-accent mb-2">🚲 Nice to know</h2>
          <p className="text-neutral">Wissen über Exkursionen, Bikes, Tipps</p>
        </div>
        <div className="bg-base p-4 rounded">
          <h2 className="font-bold text-primary mb-2">😂 Witz des Tages</h2>
          <p className="text-neutral">Täglicher Lacher fürs Team</p>
        </div>
      </div>
    </div>
  );
}
