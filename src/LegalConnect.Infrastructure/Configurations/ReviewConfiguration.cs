using LegalConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalConnect.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(1000);

        builder.HasOne(r => r.Client)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Lawyer)
            .WithMany(l => l.Reviews)
            .HasForeignKey(r => r.LawyerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Один Appointment -> один Review
        builder.HasOne(r => r.Appointment)
            .WithOne(a => a.Review)
            .HasForeignKey<Review>(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Один отзыв на одну запись
        builder.HasIndex(r => r.AppointmentId).IsUnique();

        builder.ToTable("reviews");
    }
}