using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalConnect.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentReschedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ProposedByUserId",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProposedScheduledAt",
                table: "appointments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RescheduleReason",
                table: "appointments",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RescheduleStatus",
                table: "appointments",
                type: "text",
                nullable: false,
                defaultValue: "None");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProposedByUserId",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "ProposedScheduledAt",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "RescheduleReason",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "RescheduleStatus",
                table: "appointments");
        }
    }
}
