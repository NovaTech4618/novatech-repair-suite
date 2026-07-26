export default function RecentActivity() {
  const activities = [
    {
      ticket: "NT-001",
      customer: "John Doe",
      device: "Samsung S24 Ultra",
      status: "Repairing",
    },
    {
      ticket: "NT-002",
      customer: "Mary James",
      device: "iPhone 13",
      status: "Waiting",
    },
    {
      ticket: "NT-003",
      customer: "David Paul",
      device: "Tecno Camon 40",
      status: "Completed",
    },
  ];

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-bold">
        Recent Repairs
      </h2>

      <div className="space-y-4">
        {activities.map((item) => (
          <div
            key={item.ticket}
            className="flex items-center justify-between rounded-2xl border p-4"
          >
            <div>
              <p className="font-semibold">
                {item.device}
              </p>

              <p className="text-sm text-slate-500">
                {item.customer}
              </p>
            </div>

            <div className="text-right">
              <p className="font-medium">
                {item.ticket}
              </p>

              <span className="text-sm text-blue-600">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}