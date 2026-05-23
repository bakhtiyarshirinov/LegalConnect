using LegalConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalConnect.Infrastructure.Persistence.Configurations;

public class LawyerSpecializationConfiguration : IEntityTypeConfiguration<LawyerSpecialization>
{
    public void Configure(EntityTypeBuilder<LawyerSpecialization> builder)
    {
        // Составной первичный ключ для junction table
        builder.HasKey(ls => new { ls.LawyerId, ls.SpecializationId });

        builder.HasOne(ls => ls.Lawyer)
            .WithMany(l => l.Specializations)
            .HasForeignKey(ls => ls.LawyerId);

        builder.HasOne(ls => ls.Specialization)
            .WithMany(s => s.LawyerSpecializations)
            .HasForeignKey(ls => ls.SpecializationId);

        builder.ToTable("lawyer_specializations");
    }
}