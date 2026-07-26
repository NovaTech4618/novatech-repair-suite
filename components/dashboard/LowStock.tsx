"use client";

export default function LowStock() {
  const items = [
    {
      name: "Samsung S23 Ultra Screen Guard",
      quantity: 2,
    },
    {
      name: "iPhone 13 Battery",
      quantity: 1,
    },
    {
      name: "Type-C Charging Port",
      quantity: 3,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-semibold mb-4">
        Low Stock Alert
      </h2>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center border-b pb-3"
          >
            <p className="text-sm font-medium">
              {item.name}
            </p>

            <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full">
              {item.quantity} left
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}