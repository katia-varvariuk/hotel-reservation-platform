using System.Data;
using Dapper;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal
{
    public static class DapperTypeHandlers
    {
        public static void Register()
        {
            SqlMapper.AddTypeHandler(new EnumStringTypeHandler<RoomType>());
            SqlMapper.AddTypeHandler(new EnumStringTypeHandler<RoomStatus>());
            SqlMapper.AddTypeHandler(new EnumStringTypeHandler<PriceRuleType>());
            SqlMapper.AddTypeHandler(new EnumStringTypeHandler<ReservationStatus>());
        }
    }

    public class EnumStringTypeHandler<T> : SqlMapper.TypeHandler<T> where T : struct, Enum
    {
        public override T Parse(object value)
            => Enum.TryParse<T>(value?.ToString(), ignoreCase: true, out var result) ? result : default;

        public override void SetValue(IDbDataParameter parameter, T value)
            => parameter.Value = value.ToString();
    }
}
