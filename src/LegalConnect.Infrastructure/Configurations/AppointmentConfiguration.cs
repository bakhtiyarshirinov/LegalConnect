using LegalConnect.Domain.Entities;
using LegalConnect.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalConnect.Infrastructure.Persistence.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(a => a.Type)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(a => a.Price)
            .HasPrecision(10, 2);

        builder.Property(a => a.Notes)
            .HasMaxLength(1000);

        // Клиент -> Записи (один ко многим)
        builder.HasOne(a => a.Client)
            .WithMany(u => u.Appointments)
            .HasForeignKey(a => a.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        // Юрист -> Записи (один ко многим)
        builder.HasOne(a => a.Lawyer)
            .WithMany(l => l.Appointments)
            .HasForeignKey(a => a.LawyerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable("appointments");
    }
}