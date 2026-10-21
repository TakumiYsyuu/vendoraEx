import { useCallback, useEffect, useState } from "react";
import ShopApproval from "./ShopApproval";

import {
  fetchApplications,
  loadApplicationDocuments,
  approveApplication,
  declineApplication,
} from "../logic/verificationAdmin";

export default function ShopApprovalContainer() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    try {
      setApplications(await fetchApplications());
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const onApprove = async (application) => {
    try {
      await approveApplication(application);
      await reload();
    } catch (err) {
      return { error: err.message };
    }
  };

  const onDecline = async (application, reason) => {
    try {
      await declineApplication(application, reason);
      await reload();
    } catch (err) {
      return { error: err.message };
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading applications…</p>;

  return (
    <>
      {loadError && (
        <p style={{ color: "#dc2626", fontSize: 13, paddingBottom: 12 }}>
          {loadError}
        </p>
      )}
      <ShopApproval
        applications={applications}
        onApprove={onApprove}
        onDecline={onDecline}
        onLoadDocuments={loadApplicationDocuments}
      />
    </>
  );
}
