using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalConnect.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLawyerVerificationCancellation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "lawyers",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "lawyers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "lawyers");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "lawyers");
        }
    }
}
