using LegalConnect.Application.Common.Interfaces;
using LegalConnect.Domain.Interfaces;
using MediatR;

namespace LegalConnect.Application.Notifications.Queries.GetUnreadCount;

public class GetUnreadNotificationCountQueryHandler
    : IRequestHandler<GetUnreadNotificationCountQuery, int>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public GetUnreadNotificationCountQueryHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser)
    {
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<int> Handle(
        GetUnreadNotificationCountQuery request,
        CancellationToken cancellationToken)
        => await _unitOfWork.Notifications.GetUnreadCountAsync(_currentUser.UserId);
}
