type Props = { title: string; subtitle?: string };

const PageHeader = ({ title, subtitle }: Props) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold leading-tight">{title}</h1>
    {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

export default PageHeader;
