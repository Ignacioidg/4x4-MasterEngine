using Xunit;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Domain.Enums;
using _4x4MasterEngine.Application.Validation;
using _4x4MasterEngine.Application.Services;

namespace _4x4MasterEngine.Tests;

public class CompatibilidadRulesEngineTests
{
    private readonly CompatibilidadRulesEngine _engine;

    public CompatibilidadRulesEngineTests()
    {
        _engine = new CompatibilidadRulesEngine();
    }

    [Fact]
    public void ValidateCompatibility_WithMissingRequirement_ReturnsFailure()
    {
        // Arrange
        var neum37 = new Accesorio { Id = 1, Nombre = "Neumatico 37", Categoria = "Neumatico" };
        var susp4 = new Accesorio { Id = 2, Nombre = "Suspension 4", Categoria = "Suspension" };

        var rule = new ReglaCompatibilidad
        {
            Id = 1,
            ComponenteOrigenId = neum37.Id,
            ComponenteOrigen = neum37,
            ComponenteDestinoId = susp4.Id,
            ComponenteDestino = susp4,
            Tipo = TipoRegla.Requisito
        };

        neum37.ReglasComoOrigen.Add(rule);
        susp4.ReglasComoDestino.Add(rule);

        var proposed = new List<Accesorio> { neum37 };

        // Act
        var result = _engine.ValidateCompatibility(proposed);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("requiere", result.ErrorMessage);
    }

    [Fact]
    public void ValidateCompatibility_WithIncompatibleComponents_ReturnsFailure()
    {
        // Arrange
        var neum37 = new Accesorio { Id = 1, Nombre = "Neumatico 37", Categoria = "Neumatico" };
        var susp2 = new Accesorio { Id = 4, Nombre = "Suspension 2", Categoria = "Suspension" };

        var rule = new ReglaCompatibilidad
        {
            Id = 2,
            ComponenteOrigenId = neum37.Id,
            ComponenteOrigen = neum37,
            ComponenteDestinoId = susp2.Id,
            ComponenteDestino = susp2,
            Tipo = TipoRegla.Incompatibilidad
        };

        neum37.ReglasComoOrigen.Add(rule);
        susp2.ReglasComoDestino.Add(rule);

        var proposed = new List<Accesorio> { neum37, susp2 };

        // Act
        var result = _engine.ValidateCompatibility(proposed);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("no es compatible", result.ErrorMessage);
    }

    [Fact]
    public void ValidateCompatibility_WithValidSetup_ReturnsSuccess()
    {
        // Arrange
        var neum37 = new Accesorio { Id = 1, Nombre = "Neumatico 37", Categoria = "Neumatico" };
        var susp4 = new Accesorio { Id = 2, Nombre = "Suspension 4", Categoria = "Suspension" };

        var rule = new ReglaCompatibilidad
        {
            Id = 1,
            ComponenteOrigenId = neum37.Id,
            ComponenteOrigen = neum37,
            ComponenteDestinoId = susp4.Id,
            ComponenteDestino = susp4,
            Tipo = TipoRegla.Requisito
        };

        neum37.ReglasComoOrigen.Add(rule);
        susp4.ReglasComoDestino.Add(rule);

        var proposed = new List<Accesorio> { neum37, susp4 };

        // Act
        var result = _engine.ValidateCompatibility(proposed);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage == "" ? null : result.ErrorMessage);
    }
}
