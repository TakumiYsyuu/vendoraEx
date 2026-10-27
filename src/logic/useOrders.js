import { useCallback, useEffect, useState } from "react";

// Loads a list of orders and gives back helpers for actions.
// `fetcher` must be a stable function (declared outside the component).
export default function useOrders(fetcher) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(() => {
    setError("");
    return fetcher()
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetcher]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Runs an action (API call) for one order, then refreshes the list.
  const run = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      await action();
      await reload();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return { orders, loading, error, busyId, reload, run };
}
