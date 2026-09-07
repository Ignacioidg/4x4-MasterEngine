using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Application.Interfaces;

namespace _4x4MasterEngine.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    private readonly ICurrentUserService _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();
    public DbSet<VehiculoBuild> VehiculoBuilds => Set<VehiculoBuild>();
    public DbSet<Accesorio> Accesorios => Set<Accesorio>();
    public DbSet<ReglaCompatibilidad> ReglasCompatibilidad => Set<ReglaCompatibilidad>();
    public DbSet<Trayecto> Trayectos => Set<Trayecto>();
    public DbSet<ComponenteDesgaste> ComponentesDesgaste => Set<ComponenteDesgaste>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User
        modelBuilder.Entity<User>().HasKey(u => u.Id);

        // Configure Vehiculo
        modelBuilder.Entity<Vehiculo>().HasKey(v => v.Id);
        modelBuilder.Entity<Vehiculo>()
            .HasMany(v => v.AccesoriosEquipados)
            .WithMany(); // many-to-many relationship

        modelBuilder.Entity<Vehiculo>()
            .HasMany(v => v.ComponentesDesgaste)
            .WithOne()
            .HasForeignKey(cd => cd.VehiculoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Vehiculo>()
            .HasMany(v => v.Trayectos)
            .WithOne()
            .HasForeignKey(t => t.VehiculoId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure VehiculoBuild
        modelBuilder.Entity<VehiculoBuild>().HasKey(vb => vb.Id);
        
        modelBuilder.Entity<VehiculoBuild>()
            .HasOne(vb => vb.Vehiculo)
            .WithMany(v => v.Builds)
            .HasForeignKey(vb => vb.VehiculoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VehiculoBuild>()
            .HasMany(vb => vb.Accesorios)
            .WithMany(a => a.VehiculoBuilds);

        // Configure Accesorio
        modelBuilder.Entity<Accesorio>().HasKey(a => a.Id);

        // Configure ReglaCompatibilidad - Reflexive Indirect Configuration
        modelBuilder.Entity<ReglaCompatibilidad>().HasKey(r => r.Id);

        modelBuilder.Entity<ReglaCompatibilidad>()
            .HasOne(r => r.ComponenteOrigen)
            .WithMany(a => a.ReglasComoOrigen)
            .HasForeignKey(r => r.ComponenteOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ReglaCompatibilidad>()
            .HasOne(r => r.ComponenteDestino)
            .WithMany(a => a.ReglasComoDestino)
            .HasForeignKey(r => r.ComponenteDestinoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure Trayecto
        modelBuilder.Entity<Trayecto>().HasKey(t => t.Id);

        // Configure ComponenteDesgaste
        modelBuilder.Entity<ComponenteDesgaste>().HasKey(c => c.Id);

        // Configure AuditLog
        modelBuilder.Entity<AuditLog>().HasKey(a => a.Id);
    }

    public override int SaveChanges()
    {
        OnBeforeSaveChanges();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        OnBeforeSaveChanges();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void OnBeforeSaveChanges()
    {
        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditEntry>();
        var username = _currentUserService?.Username ?? "System";

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            var auditEntry = new AuditEntry(entry)
            {
                TableName = entry.Entity.GetType().Name,
                Username = username
            };
            auditEntries.Add(auditEntry);

            foreach (var property in entry.Properties)
            {
                string propertyName = property.Metadata.Name;
                if (property.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[propertyName] = property.CurrentValue;
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.NewValues[propertyName] = property.CurrentValue;
                        break;
                    case EntityState.Deleted:
                        auditEntry.OldValues[propertyName] = property.OriginalValue;
                        break;
                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                        }
                        break;
                }
            }
        }

        foreach (var auditEntry in auditEntries)
        {
            AuditLogs.Add(auditEntry.ToAuditLog());
        }
    }
}

internal class AuditEntry
{
    public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        Entry = entry;
    }

    public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
    public string TableName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public Dictionary<string, object?> KeyValues { get; } = new();
    public Dictionary<string, object?> OldValues { get; } = new();
    public Dictionary<string, object?> NewValues { get; } = new();

    public AuditLog ToAuditLog()
    {
        var audit = new AuditLog
        {
            EntityName = TableName,
            Username = Username,
            Timestamp = DateTime.UtcNow,
            PrimaryKey = JsonSerializer.Serialize(KeyValues),
            Action = Entry.State switch
            {
                EntityState.Added => "INSERT",
                EntityState.Deleted => "DELETE",
                EntityState.Modified => "UPDATE",
                _ => "UNKNOWN"
            },
            OldValues = OldValues.Count == 0 ? string.Empty : JsonSerializer.Serialize(OldValues),
            NewValues = NewValues.Count == 0 ? string.Empty : JsonSerializer.Serialize(NewValues)
        };
        return audit;
    }
}
