namespace _4x4MasterEngine.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // e.g. "INSERT", "UPDATE", "DELETE"
    public string PrimaryKey { get; set; } = string.Empty;
    public string OldValues { get; set; } = string.Empty; // JSON string
    public string NewValues { get; set; } = string.Empty; // JSON string
    public string Username { get; set; } = "System";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
