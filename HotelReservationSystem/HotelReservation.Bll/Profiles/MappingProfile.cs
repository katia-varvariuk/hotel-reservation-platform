using AutoMapper;
using HotelReservation.Domain.Entities;
using HotelReservation.Bll.DTOs;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Bll.Profiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Client, ClientDto>();
            CreateMap<ClientDto, Client>();
            CreateMap<CreateClientDto, Client>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.ClientId, opt => opt.Ignore())
                .ForMember(dest => dest.Reservations, opt => opt.Ignore());
            CreateMap<UpdateClientDto, Client>()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Reservations, opt => opt.Ignore());

            CreateMap<Room, RoomDto>()
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => src.RoomType.ToString()))
                .ForMember(dest => dest.Status,   opt => opt.MapFrom(src => src.Status.ToString()));
            CreateMap<RoomDto, Room>()
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => Enum.Parse<RoomType>(src.RoomType, true)))
                .ForMember(dest => dest.Status,   opt => opt.MapFrom(src => Enum.Parse<RoomStatus>(src.Status, true)));
            CreateMap<CreateRoomDto, Room>()
                .ForMember(dest => dest.RoomId,      opt => opt.Ignore())
                .ForMember(dest => dest.Reservations, opt => opt.Ignore())
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => Enum.Parse<RoomType>(src.RoomType, true)))
                .ForMember(dest => dest.Status,   opt => opt.MapFrom(src => Enum.Parse<RoomStatus>(src.Status, true)));
            CreateMap<Room, AvailableRoomDto>()
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => src.RoomType.ToString()))
                .ForMember(dest => dest.Status,   opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<PriceRule, PriceRuleDto>()
                .ForMember(dest => dest.RuleType, opt => opt.MapFrom(src => src.RuleType.ToString()));
            CreateMap<CreatePriceRuleDto, PriceRule>()
                .ForMember(dest => dest.PriceRuleId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt,   opt => opt.Ignore())
                .ForMember(dest => dest.RuleType,    opt => opt.MapFrom(src => Enum.Parse<PriceRuleType>(src.RuleType, true)));

            CreateMap<Reservation, ReservationDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));
            CreateMap<ReservationDto, Reservation>();
            CreateMap<CreateReservationDto, Reservation>()
                .ForMember(dest => dest.ReservationId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ReservationStatus.Pending))
                .ForMember(dest => dest.TotalPrice, opt => opt.Ignore())
                .ForMember(dest => dest.Client, opt => opt.Ignore())
                .ForMember(dest => dest.Room, opt => opt.Ignore())
                .ForMember(dest => dest.Payments, opt => opt.Ignore());

            CreateMap<Payment, PaymentDto>();
            CreateMap<PaymentDto, Payment>();
            CreateMap<CreatePaymentDto, Payment>()
                .ForMember(dest => dest.PaymentId, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentDate, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.Reservation, opt => opt.Ignore());
        }
    }
}