import { useEffect, useState } from "react";
import { getShopProfile } from "./verification";

export default function useVerificationStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getShopProfile()
      .then((p) => active && setStatus(p.verification_status))
      .catch(() => active && setStatus("not_verified"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { status, loading, isVerified: status === "verified" };
}
