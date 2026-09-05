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

        builder.Property(a => a.SlotId).IsRequired(false);

        builder.Property(a => a.MeetingUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(a => a.CancellationReason)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(a => a.CancelledAt)
            .IsRequired(false);

        builder.Property(a => a.RescheduleStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasDefaultValue(Domain.Enums.RescheduleStatus.None);

        builder.Property(a => a.RescheduleReason)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(a => a.ProposedScheduledAt).IsRequired(false);
        builder.Property(a => a.ProposedByUserId).IsRequired(false);

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