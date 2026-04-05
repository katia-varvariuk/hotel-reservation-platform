using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HotelReservation.Domain.Exceptions
{
    public abstract class DomainException : Exception
    {
        protected DomainException(string message) : base(message) { }
        protected DomainException(string message, Exception innerException) : base(message, innerException) { }
    }

    public class NotFoundException : DomainException
    {
        public NotFoundException(string message) : base(message) { }
    }

    public class BusinessConflictException : DomainException
    {
        public BusinessConflictException(string message) : base(message) { }
    }

    public class ValidationException : DomainException
    {
        public ValidationException(string message) : base(message) { }
    }
}