using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Domain.Enums;
using _4x4MasterEngine.Application.Interfaces;

namespace _4x4MasterEngine.Application.Services;

public class MaintenanceTrackerService : IMaintenanceTrackerService
{
    public double GetSeverityCoefficient(TipoSuelo suelo)
    {
        return suelo switch
        {
            TipoSuelo.Asfalto => 1.0,
            TipoSuelo.Arena => 1.5,
            TipoSuelo.Barro => 2.0,
            TipoSuelo.Piedra => 2.5,
            _ => 1.0
        };
    }

    public void ProcessTrayecto(Vehiculo vehiculo, double kilometros, TipoSuelo suelo)
    {
        if (vehiculo == null) throw new ArgumentNullException(nameof(vehiculo));

        double coefficient = GetSeverityCoefficient(suelo);
        double wearIncreaseKm = kilometros * coefficient;

        // Update each wear component of the vehicle
        foreach (var component in vehiculo.ComponentesDesgaste)
        {
            component.KilometrosSeverosAcumulados += wearIncreaseKm;
            component.DesgasteAcumulado = Math.Min(100.0, (component.KilometrosSeverosAcumulados / component.VidaUtilKmEquivalentes) * 100.0);
        }

        // Add the journey to history
        vehiculo.Trayectos.Add(new Trayecto
        {
            VehiculoId = vehiculo.Id,
            Kilometros = kilometros,
            Suelo = suelo,
            Fecha = DateTime.UtcNow
        });
    }
}
