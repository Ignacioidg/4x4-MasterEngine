namespace _4x4MasterEngine.Application.DTOs;

public class UserRegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Usuario"; // "Administrador" or "Usuario"
}
