using LegalConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalConnect.Infrastructure.Persistence.Configurations;

public class LawyerConfiguration : IEntityTypeConfiguration<Lawyer>
{
    public void Configure(EntityTypeBuilder<Lawyer> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Bio)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(l => l.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(l => l.LicenseNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(l => l.HourlyRate)
            .HasPrecision(10, 2); // Деньги: 10 цифр, 2 после запятой

        builder.Property(l => l.CancellationReason)
            .HasMaxLength(1000);

        builder.Property(l => l.Rating)
            .HasPrecision(3, 2);

        // Один User -> один Lawyer профиль
        builder.HasOne(l => l.User)
            .WithOne(u => u.LawyerProfile)
            .HasForeignKey<Lawyer>(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => l.LicenseNumber).IsUnique();

        builder.ToTable("lawyers");
    }
}