using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using _4x4MasterEngine.Application.Interfaces;
using _4x4MasterEngine.Application.Services;
using _4x4MasterEngine.Infrastructure.Persistence;
using _4x4MasterEngine.Infrastructure.Repositories;
using _4x4MasterEngine.Infrastructure.Security;
using _4x4MasterEngine.Infrastructure.Services;
using _4x4MasterEngine.API.Services;
using _4x4MasterEngine.API.Middleware;
using _4x4MasterEngine.Domain.Entities;
using _4x4MasterEngine.Domain.Enums;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });

// Configure DB Context with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication & JWT Config
var jwtKey = builder.Configuration["Jwt:Key"] ?? "4x4MasterEngineSuperSecretSecureKey123456789";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "4ME-API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "4ME-Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register custom services and interfaces
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient<ICarQueryService, CarQueryService>();
builder.Services.AddHttpClient<IVehicleCatalogService, NhtsaVpicService>();
builder.Services.AddHttpClient<IMercadoLibreService, MercadoLibreService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<ICompatibilidadRulesEngine, CompatibilidadRulesEngine>();
builder.Services.AddScoped<IPresupuestoService, PresupuestoService>();
builder.Services.AddScoped<IMaintenanceTrackerService, MaintenanceTrackerService>();

// Register Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IVehiculoRepository, VehiculoRepository>();
builder.Services.AddScoped<IAccesorioRepository, AccesorioRepository>();
builder.Services.AddScoped<IReglaCompatibilidadRepository, ReglaCompatibilidadRepository>();

// Learn more about configuring OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
            ctx.Context.Response.Headers.Append("Pragma", "no-cache");
            ctx.Context.Response.Headers.Append("Expires", "0");
        }
    }
});
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

// Database Migration and Seeding
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // EnsureCreated checks if database exists; if not, creates database and tables
        context.Database.EnsureCreated();

        var passwordHasher = services.GetRequiredService<IPasswordHasher>();
        SeedDatabase(context, passwordHasher);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or seeding the database.");
    }
}

app.Run();

void SeedDatabase(ApplicationDbContext context, IPasswordHasher passwordHasher)
{
    // Seed Users
    if (!context.Users.Any())
    {
        context.Users.AddRange(
            new User { Username = "admin", PasswordHash = passwordHasher.HashPassword("admin"), Role = "Administrador" },
            new User { Username = "user", PasswordHash = passwordHasher.HashPassword("user"), Role = "Usuario" }
        );
        context.SaveChanges();
    }

    // Seed Accessories
    if (!context.Accesorios.Any())
    {
        var neum37 = new Accesorio { Nombre = "Neumatico de 37 pulgadas MaxClaw", Descripcion = "Neumáticos off-road extremos de 37 pulgadas.", Precio = 450.00m, Categoria = "Neumatico" };
        var susp4 = new Accesorio { Nombre = "Suspension Reforzada de 4 pulgadas ToughDog", Descripcion = "Kit de suspensión de 4 pulgadas para trabajo pesado.", Precio = 1200.00m, Categoria = "Suspension" };
        var neum35 = new Accesorio { Nombre = "Neumatico de 35 pulgadas TrailRunner", Descripcion = "Neumáticos todoterreno de 35 pulgadas.", Precio = 350.00m, Categoria = "Neumatico" };
        var susp2 = new Accesorio { Nombre = "Suspension de 2 pulgadas IronMan", Descripcion = "Kit de suspensión estándar de 2 pulgadas.", Precio = 800.00m, Categoria = "Suspension" };
        var paragolpes = new Accesorio { Nombre = "Paragolpes Off-road de Acero Rhino", Descripcion = "Paragolpes delantero de acero de alta resistencia.", Precio = 750.00m, Categoria = "Paragolpes" };
        var winch = new Accesorio { Nombre = "Malacate / Winch Warn 12000 lbs", Descripcion = "Winch de rescate con cable sintético de 12000 lbs.", Precio = 600.00m, Categoria = "Winch" };

        context.Accesorios.AddRange(neum37, susp4, neum35, susp2, paragolpes, winch);
        context.SaveChanges();

        // Seed Rules
        context.ReglasCompatibilidad.AddRange(
            // Neumatico 37 requiere suspension 4
            new ReglaCompatibilidad { ComponenteOrigenId = neum37.Id, ComponenteDestinoId = susp4.Id, Tipo = TipoRegla.Requisito },
            // Neumatico 37 es incompatible con suspension 2
            new ReglaCompatibilidad { ComponenteOrigenId = neum37.Id, ComponenteDestinoId = susp2.Id, Tipo = TipoRegla.Incompatibilidad },
            // Winch requiere paragolpes
            new ReglaCompatibilidad { ComponenteOrigenId = winch.Id, ComponenteDestinoId = paragolpes.Id, Tipo = TipoRegla.Requisito }
        );
        context.SaveChanges();

        // Seed default Vehicle
        var jeep = new Vehiculo
        {
            Marca = "Jeep",
            Modelo = "Wrangler Rubicon",
            Anio = 2022,
            Patente = "AF370ME",
            ComponentesDesgaste = new List<ComponenteDesgaste>
            {
                new ComponenteDesgaste { Nombre = "Suspension y Amortiguadores", VidaUtilKmEquivalentes = 80000, DesgasteAcumulado = 0, KilometrosSeverosAcumulados = 0 },
                new ComponenteDesgaste { Nombre = "Neumaticos Todoterreno", VidaUtilKmEquivalentes = 60000, DesgasteAcumulado = 0, KilometrosSeverosAcumulados = 0 },
                new ComponenteDesgaste { Nombre = "Pastillas y Discos de Freno", VidaUtilKmEquivalentes = 40000, DesgasteAcumulado = 0, KilometrosSeverosAcumulados = 0 }
            }
        };
        context.Vehiculos.Add(jeep);
        context.SaveChanges();
    }
}
