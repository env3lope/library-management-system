function Availability({ available, total }) {
  const unavailable = Number(available) === 0;
  return (
    <span
      className={`inline-flex items-center gap-2 text-label font-semibold ${
        unavailable ? "text-availability-text-empty" : "text-availability-text"
      }`}
    >
      <i
        className={`h-2 w-2 rounded-full ${
          unavailable ? "bg-availability-dot-empty" : "bg-availability-dot"
        }`}
      />
      {available} <span className="font-normal text-text-low">/ {total}</span>
    </span>
  );
}

export default Availability;
