using LegalConnect.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalConnect.Infrastructure.Persistence.Configurations;

public class ChatConfiguration : IEntityTypeConfiguration<Chat>
{
    public void Configure(EntityTypeBuilder<Chat> builder)
    {
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.Client)
            .WithMany()
            .HasForeignKey(c => c.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Lawyer)
            .WithMany()
            .HasForeignKey(c => c.LawyerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Один чат между клиентом и юристом
        builder.HasIndex(c => new { c.ClientId, c.LawyerId }).IsUnique();

        builder.ToTable("chats");
    }
}