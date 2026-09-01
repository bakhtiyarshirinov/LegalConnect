using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Chat.Queries.GetUnreadCount;

public class GetUnreadCountQueryHandler : IRequestHandler<GetUnreadCountQuery, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetUnreadCountQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<int> Handle(GetUnreadCountQuery request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.Chats.GetUnreadCountAsync(_currentUser.UserId);
    }
}
