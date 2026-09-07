using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Domain.Enums;

namespace _4x4MasterEngine.Application.Interfaces;

public interface IMaintenanceTrackerService
{
    double GetSeverityCoefficient(TipoSuelo suelo);
    void ProcessTrayecto(Vehiculo vehiculo, double kilometros, TipoSuelo suelo);
}
