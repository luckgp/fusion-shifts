import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Orfeo</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Déclaration d'heures salariés
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bienvenue sur votre espace de déclaration d'heures
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Consultez vos créneaux planifiés et déclarez facilement vos heures réalisées
            </p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/shifts">
                <Calendar className="w-5 h-5 mr-2" />
                Accéder à mes créneaux
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader className="text-center">
                <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Mes créneaux</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Visualisez tous vos créneaux planifiés avec les détails de profession, service et lieu
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Clock className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Déclaration rapide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Déclarez vos heures réalisées directement depuis l'interface avec notes optionnelles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Suivi en temps réel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Suivez le statut de vos déclarations : en attente, en validation ou validées
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status legend */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-center">Statuts des créneaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto"></div>
                  <div className="text-sm font-medium">À venir</div>
                  <div className="text-xs text-muted-foreground">Créneau planifié</div>
                </div>
                <div className="space-y-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto"></div>
                  <div className="text-sm font-medium">À déclarer</div>
                  <div className="text-xs text-muted-foreground">Action requise</div>
                </div>
                <div className="space-y-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto"></div>
                  <div className="text-sm font-medium">En validation</div>
                  <div className="text-xs text-muted-foreground">En cours de traitement</div>
                </div>
                <div className="space-y-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto"></div>
                  <div className="text-sm font-medium">Validé</div>
                  <div className="text-xs text-muted-foreground">Approuvé</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
