import { useState, useEffect } from "react";
import { EmployeeWorkingHours, listWorkingHours, getWeekRange } from "@/lib/orfeo-client";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { TimesheetForm } from "@/components/shifts/TimesheetForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Pour la démo, utilisation d'un ID employé fixe
const DEMO_EMPLOYEE_ID = parseInt(import.meta.env.VITE_DEMO_EMPLOYEE_ID || "1");

export default function Shifts() {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<EmployeeWorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<EmployeeWorkingHours | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const loadShifts = async () => {
    setLoading(true);
    setError(null);

    try {
      const weekRange = getWeekRange(currentWeek);
      const data = await listWorkingHours({
        employeeId: DEMO_EMPLOYEE_ID,
        overlapAfter: weekRange.start,
        overlapBefore: weekRange.end
      });

      setShifts(data);
    } catch (err) {
      console.error("Erreur lors du chargement des créneaux:", err);
      setError("Impossible de charger vos créneaux. Vérifiez votre connexion et réessayez.");
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger vos créneaux",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [currentWeek]);

  const handleDeclare = (shift: EmployeeWorkingHours) => {
    setSelectedShift(shift);
  };

  const handleDeclarationSuccess = (updatedShift: EmployeeWorkingHours) => {
    // Mettre à jour la liste des créneaux
    setShifts(prev => prev.map(shift => 
      shift.pk === updatedShift.pk ? updatedShift : shift
    ));
    setSelectedShift(null);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const getWeekDisplay = () => {
    const range = getWeekRange(currentWeek);
    const start = new Date(range.start);
    const end = new Date(range.end);
    
    return `${format(start, "dd MMM", { locale: fr })} - ${format(end, "dd MMM yyyy", { locale: fr })}`;
  };

  if (selectedShift) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TimesheetForm
          shift={selectedShift}
          onSuccess={handleDeclarationSuccess}
          onCancel={() => setSelectedShift(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Clock className="w-8 h-8" />
          Mes créneaux
        </h1>
        <p className="text-muted-foreground">
          Consultez vos créneaux planifiés et déclarez vos heures réalisées
        </p>
      </div>

      {/* Navigation semaine */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Semaine du {getWeekDisplay()}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                ← Précédente
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                Suivante →
              </Button>
              <Button variant="outline" size="sm" onClick={loadShifts}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contenu */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="flex justify-end">
                    <Skeleton className="h-9 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadShifts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun créneau</h3>
              <p className="text-muted-foreground">
                Vous n'avez aucun créneau planifié pour cette semaine.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shifts.map((shift) => (
            <ShiftCard
              key={shift.pk}
              shift={shift}
              onDeclare={handleDeclare}
            />
          ))}
        </div>
      )}
    </div>
  );
}