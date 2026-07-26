export default function TaskList() {
  const tasks = [
    "Call customer for pickup",
    "Order Samsung screens",
    "Check low stock",
    "Complete pending repairs",
  ];

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-bold">
        Today's Tasks
      </h2>

      <div className="space-y-4">
        {tasks.map((task) => (
          <label
            key={task}
            className="flex items-center gap-3"
          >
            <input
              type="checkbox"
              className="h-5 w-5"
            />

            <span>{task}</span>
          </label>
        ))}
      </div>
    </div>
  );
}