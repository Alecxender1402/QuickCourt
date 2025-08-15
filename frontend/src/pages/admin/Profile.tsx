import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";

const AdminProfile = () => {
  return (
    <div className="container py-10">
      <SEO title="Admin Profile – QuickCourt" description="View and update your admin profile." />
      <PageHeader title="Admin Profile" />
      <p className="text-sm text-muted-foreground">Basic profile settings go here.</p>
    </div>
  );
};

//profile

export default AdminProfile;
