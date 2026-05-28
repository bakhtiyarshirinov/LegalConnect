using LegalConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalConnect.Infrastructure.Persistence.Configurations;

public class AvailabilitySlotConfiguration : IEntityTypeConfiguration<AvailabilitySlot>
{
    public void Configure(EntityTypeBuilder<AvailabilitySlot> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.AppointmentId).IsRequired(false);

        builder.HasOne(s => s.Lawyer)
            .WithMany()
            .HasForeignKey(s => s.LawyerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("availability_slots");
    }
}
