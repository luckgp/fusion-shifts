import { useState } from "react";
import { EmployeeWorkingHours, DeclareHoursPayload, declareHours } from "@/lib/orfeo-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Calendar, Save, X } from "lucide-react";

interface TimesheetFormProps {
  shift: EmployeeWorkingHours;
  onSuccess?: (updatedShift: EmployeeWorkingHours) => void;
  onCancel?: () => void;
}

export function TimesheetForm({ shift, onSuccess, onCancel }: TimesheetFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Initialisation avec les heures planifiées ou effectives existantes
  const [formData, setFormData] = useState({
    startDate: shift.start_datetime ? format(parseISO(shift.start_datetime), "yyyy-MM-dd") : "",
    startTime: shift.start_datetime ? format(parseISO(shift.start_datetime), "HH:mm") : "",
    endDate: shift.end_datetime ? format(parseISO(shift.end_datetime), "yyyy-MM-dd") : "",
    endTime: shift.end_datetime ? format(parseISO(shift.end_datetime), "HH:mm") : "",
    note: shift.notes || ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate || !formData.startTime) {
      newErrors.start = "L'heure de début est obligatoire";
    }

    if (!formData.endDate || !formData.endTime) {
      newErrors.end = "L'heure de fin est obligatoire";
    }

    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (startDateTime >= endDateTime) {
        newErrors.end = "L'heure de fin doit être après l'heure de début";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: DeclareHoursPayload = {
        start_datetime: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
        end_datetime: new Date(`${formData.endDate}T${formData.endTime}`).toISOString(),
        note: formData.note || undefined
      };

      const updatedShift = await declareHours(shift.pk, payload);
      
      toast({
        title: "Heures déclarées",
        description: "Vos heures ont été déclarées avec succès et sont en attente de validation.",
      });

      onSuccess?.(updatedShift);
    } catch (error) {
      console.error("Erreur lors de la déclaration:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déclaration de vos heures.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateTime: string | null) => {
    if (!dateTime) return "Non défini";
    return format(parseISO(dateTime), "dd/MM/yyyy à HH:mm", { locale: fr });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Déclarer mes heures - Créneau #{shift.pk}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4" />
            Planifié : du {formatDisplayDate(shift.start_datetime)} au {formatDisplayDate(shift.end_datetime)}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Heures de début */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={errors.start ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={errors.start ? "border-destructive" : ""}
              />
            </div>
          </div>
          {errors.start && (
            <p className="text-sm text-destructive">{errors.start}</p>
          )}

          {/* Heures de fin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={errors.end ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className={errors.end ? "border-destructive" : ""}
              />
            </div>
          </div>
          {errors.end && (
            <p className="text-sm text-destructive">{errors.end}</p>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optionnelle)</Label>
            <Textarea
              id="note"
              placeholder="Ajoutez une note pour justifier vos heures réalisées..."
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              maxLength={2000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {formData.note.length}/2000 caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Déclaration..." : "Déclarer les heures"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}