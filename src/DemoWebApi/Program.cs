using DemoWebApi.Business;
using DemoWebApi.Data;
using LightTrace.UI;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register our demo services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();

builder.Services.AddLightTrace(options =>
{
    options.BasePath = "/monitoring"; // Custom base path
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use LightTrace - One line integration!
app.UseLightTrace();

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();