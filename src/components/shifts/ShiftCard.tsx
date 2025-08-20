import { EmployeeWorkingHours, ShiftStatus, mapStatus } from "@/lib/orfeo-client";
import { ShiftStatusBadge } from "./ShiftStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Briefcase, Building2, StickyNote } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface ShiftCardProps {
  shift: EmployeeWorkingHours;
  onDeclare?: (shift: EmployeeWorkingHours) => void;
  className?: string;
}

export function ShiftCard({ shift, onDeclare, className }: ShiftCardProps) {
  const now = new Date().toISOString();
  const status = mapStatus(shift, now);
  
  const canDeclare = status === "TO_DECLARE" && onDeclare;
  const isReadOnly = status === "APPROVED";

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "Non défini";
    return format(parseISO(dateTime), "dd/MM/yyyy HH:mm", { locale: fr });
  };

  const formatTime = (dateTime: string | null) => {
    if (!dateTime) return "Non défini";
    return format(parseISO(dateTime), "HH:mm");
  };

  const getDateRange = () => {
    if (!shift.start_datetime || !shift.end_datetime) return "Dates non définies";
    
    const start = parseISO(shift.start_datetime);
    const end = parseISO(shift.end_datetime);
    
    if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
      return `${format(start, "dd/MM/yyyy", { locale: fr })} de ${formatTime(shift.start_datetime)} à ${formatTime(shift.end_datetime)}`;
    } else {
      return `Du ${formatDateTime(shift.start_datetime)} au ${formatDateTime(shift.end_datetime)}`;
    }
  };

  return (
    <Card className={`${className} ${isReadOnly ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Créneau #{shift.pk}
          </CardTitle>
          <ShiftStatusBadge status={status} />
        </div>
        
        <div className="text-sm text-muted-foreground">
          {getDateRange()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations contextuelles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {shift.profession && (
            <Badge variant="outline" className="justify-start">
              <Briefcase className="w-3 h-3 mr-1" />
              Profession {shift.profession}
            </Badge>
          )}
          {shift.service && (
            <Badge variant="outline" className="justify-start">
              <Building2 className="w-3 h-3 mr-1" />
              Service {shift.service}
            </Badge>
          )}
          {shift.place && (
            <Badge variant="outline" className="justify-start">
              <MapPin className="w-3 h-3 mr-1" />
              Lieu {shift.place}
            </Badge>
          )}
        </div>

        {/* Notes planifiées */}
        {shift.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <StickyNote className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Note planifiée :</p>
                <p className="text-sm text-muted-foreground mt-1">{shift.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          {canDeclare && (
            <Button 
              onClick={() => onDeclare(shift)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Déclarer mes heures
            </Button>
          )}
          {isReadOnly && (
            <Badge variant="outline" className="text-green-600">
              Créneau validé
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}