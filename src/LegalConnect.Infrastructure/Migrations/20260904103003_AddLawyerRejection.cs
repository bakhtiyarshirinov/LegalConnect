using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalConnect.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLawyerRejection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAt",
                table: "lawyers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "lawyers",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectedAt",
                table: "lawyers");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "lawyers");
        }
    }
}
