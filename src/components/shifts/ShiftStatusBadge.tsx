import { Badge } from "@/components/ui/badge";
import { ShiftStatus } from "@/lib/orfeo-client";
import { Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";

interface ShiftStatusBadgeProps {
  status: ShiftStatus;
  className?: string;
}

const statusConfig = {
  UPCOMING: {
    label: "À venir",
    variant: "secondary" as const,
    icon: Calendar,
    className: "bg-blue-50 text-blue-700 border-blue-200"
  },
  TO_DECLARE: {
    label: "À déclarer",
    variant: "destructive" as const,
    icon: Clock,
    className: "bg-orange-50 text-orange-700 border-orange-200"
  },
  IN_REVIEW: {
    label: "En validation",
    variant: "outline" as const,
    icon: AlertCircle,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200"
  },
  APPROVED: {
    label: "Validé",
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-50 text-green-700 border-green-200"
  }
};

export function ShiftStatusBadge({ status, className }: ShiftStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ""}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}