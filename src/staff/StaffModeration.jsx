import AdminModeration from "../admin/AdminModeration";

// Staff uses the same marketplace management screens as Admin.
export default function StaffModeration({ page, go, user }) {
  const sharedPage = page === "staff-dashboard" ? "admin-dashboard" : page;
  return <AdminModeration page={sharedPage} go={go} user={user} />;
}
