using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalConnect.Infrastructure.Migrations
{
    /// <summary>
    /// Data-only fix for the lawyer verification desync.
    ///
    /// Background: "lawyer is verified" has a single source of truth — <c>lawyers."IsVerified"</c>,
    /// set by the admin Approve/Revoke actions. <c>users."IsVerified"</c> is a different concept
    /// (e-mail/OTP confirmation) and is deliberately NOT touched here. The admin "İstifadəçilər"
    /// screen was the only place reading the wrong column; that is fixed in GetAllUsersQueryHandler.
    ///
    /// The one genuine record-level inconsistency to repair: a lawyer who was revoked and later
    /// re-verified could keep stale <c>CancellationReason</c>/<c>CancelledAt</c> values while
    /// <c>IsVerified = true</c>. Latest admin action wins → clear that leftover metadata.
    /// </summary>
    public partial class ReconcileLawyerVerificationFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE lawyers
                SET "CancellationReason" = NULL,
                    "CancelledAt" = NULL
                WHERE "IsVerified" = TRUE
                  AND ("CancellationReason" IS NOT NULL OR "CancelledAt" IS NOT NULL);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Irreversible: the cleared revoke reason/timestamp were stale and are not recoverable.
        }
    }
}
