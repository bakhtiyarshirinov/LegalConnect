using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalConnect.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAvailabilitySlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SlotId",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "availability_slots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LawyerId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsBooked = table.Column<bool>(type: "boolean", nullable: false),
                    AppointmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_availability_slots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_availability_slots_lawyers_LawyerId",
                        column: x => x.LawyerId,
                        principalTable: "lawyers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_availability_slots_LawyerId",
                table: "availability_slots",
                column: "LawyerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "availability_slots");

            migrationBuilder.DropColumn(
                name: "SlotId",
                table: "appointments");
        }
    }
}
