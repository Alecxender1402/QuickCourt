import { Navigate } from "react-router-dom";

interface RedirectRouteProps {
  from: string;
  to: string;
}

const RedirectRoute = ({ to }: RedirectRouteProps) => {
  return <Navigate to={to} replace />;
};

export default RedirectRoute;
