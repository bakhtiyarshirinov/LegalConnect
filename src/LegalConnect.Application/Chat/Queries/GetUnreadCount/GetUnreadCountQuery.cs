using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetUnreadCount;

public record GetUnreadCountQuery(Guid UserId) : IRequest<int>;
