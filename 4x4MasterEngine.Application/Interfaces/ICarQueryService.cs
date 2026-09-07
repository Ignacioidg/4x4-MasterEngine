namespace _4x4MasterEngine.Application.Interfaces;

public interface ICarQueryService
{
    Task<string> GetYearsAsync();
    Task<string> GetMakesAsync(int year);
    Task<string> GetModelsAsync(int year, string make);
    Task<string> GetTrimsAsync(int year, string make, string model);
}
