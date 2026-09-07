using Xunit;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Domain.Enums;
using _4x4MasterEngine.Application.Services;

namespace _4x4MasterEngine.Tests;

public class MaintenanceTrackerTests
{
    private readonly MaintenanceTrackerService _trackerService;

    public MaintenanceTrackerTests()
    {
        _trackerService = new MaintenanceTrackerService();
    }

    [Theory]
    [InlineData(TipoSuelo.Asfalto, 1.0)]
    [InlineData(TipoSuelo.Arena, 1.5)]
    [InlineData(TipoSuelo.Barro, 2.0)]
    [InlineData(TipoSuelo.Piedra, 2.5)]
    public void GetSeverityCoefficient_ReturnsCorrectMultiplier(TipoSuelo suelo, double expectedCoefficient)
    {
        // Act
        var coefficient = _trackerService.GetSeverityCoefficient(suelo);

        // Assert
        Assert.Equal(expectedCoefficient, coefficient);
    }

    [Fact]
    public void ProcessTrayecto_CalculatesWearCorrectly()
    {
        // Arrange
        var vehiculo = new Vehiculo
        {
            Id = 1,
            Marca = "Jeep",
            ComponentesDesgaste = new List<ComponenteDesgaste>
            {
                new ComponenteDesgaste { Nombre = "Neumaticos", VidaUtilKmEquivalentes = 50000, DesgasteAcumulado = 0, KilometrosSeverosAcumulados = 0 }
            }
        };

        double kmReales = 100.0;
        var suelo = TipoSuelo.Barro; // Coeff = 2.0
        // Expected wear = 100 * 2.0 = 200 km equivalents
        // Wear percentage = (200 / 50000) * 100 = 0.4%

        // Act
        _trackerService.ProcessTrayecto(vehiculo, kmReales, suelo);

        // Assert
        var comp = vehiculo.ComponentesDesgaste.First();
        Assert.Equal(200.0, comp.KilometrosSeverosAcumulados);
        Assert.Equal(0.4, comp.DesgasteAcumulado);
        Assert.Single(vehiculo.Trayectos);
        Assert.Equal(100.0, vehiculo.Trayectos.First().Kilometros);
    }
}
