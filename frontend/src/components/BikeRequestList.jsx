import { useEffect, useState } from "react";

export default function BikeRequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/bike-requests")
      .then((res) => {
        if (!res.ok) throw new Error("Fehler beim Laden");
        return res.json();
      })
      .then((data) => {
        setRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-gray-500">Lade Anfragen...</p>;
  if (error) return <p className="text-red-500">Fehler: {error}</p>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Fahrrad-Anfragen</h2>
      {requests.map((req) => (
        <div
          key={req.id}
          className="border border-gray-300 rounded-xl p-4 shadow-sm bg-white"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              {req.fahrrad} von {req.start} → {req.ziel}
            </span>
            <span className="text-sm text-gray-500">
              bis{" "}
              {new Date(req.zeitpunkt).toLocaleString("de-DE", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="text-sm">
            <p>
              <strong>Grund:</strong> {req.grund}
            </p>
            <p>
              <strong>Transporteur:</strong>{" "}
              <span className="text-blue-600">{req.transporteur}</span>
            </p>
            <p>
              <strong>Erstellt von:</strong> {req.ersteller}
            </p>
            {req.anmerkung && (
              <p className="italic text-gray-600 mt-1">
                💬 {req.anmerkung}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
