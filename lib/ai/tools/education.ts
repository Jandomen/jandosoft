import type { ToolDefinition, ToolResult } from "./base";

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_class",
      description: "Create a new class or course",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Class name" },
          teacher: { type: "string", description: "Teacher name" },
          schedule: { type: "string", description: "Schedule (e.g. Lunes y Miércoles 10:00-11:00)" },
          capacity: { type: "number", description: "Maximum students" },
          price: { type: "number", description: "Price per student" },
          room: { type: "string", description: "Room or location" },
          startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
          endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
        },
        required: ["name", "teacher"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_class",
      description: "Update a class details",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Current class name" },
          newName: { type: "string", description: "New class name" },
          teacher: { type: "string", description: "New teacher" },
          schedule: { type: "string", description: "New schedule" },
          capacity: { type: "number", description: "New max students" },
          price: { type: "number", description: "New price" },
          room: { type: "string", description: "New room" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_class",
      description: "Delete a class by name",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Class name to delete" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_classes",
      description: "List all classes for the store",
      parameters: {
        type: "object",
        properties: {
          teacher: { type: "string", description: "Filter by teacher name" },
          limit: { type: "number", description: "Max results (default 50)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "enroll_student",
      description: "Enroll a student in a class",
      parameters: {
        type: "object",
        properties: {
          className: { type: "string", description: "Class name" },
          studentName: { type: "string", description: "Student name" },
          studentEmail: { type: "string", description: "Student email" },
        },
        required: ["className", "studentName"],
      },
    },
  },
];

export async function executeEducationTool(name: string, args: any, store: any, _userId: string): Promise<ToolResult> {
  const storeId = store?._id || store?.id;
  if (!storeId) return { error: "No store selected" };

  const { connectDB } = await import("@/lib/mongodb");
  const { Store } = await import("@/lib/models/Store");
  await connectDB();
  const s = await Store.findById(storeId);
  if (!s) return { error: "Store not found" };

  if (name === "create_class") {
    const maxId = Math.max(0, ...s.classes.map((c: any) => c.id || 0));
    s.classes.push({
      id: maxId + 1,
      name: args.name,
      teacher: args.teacher,
      schedule: args.schedule || "",
      capacity: args.capacity || 0,
      price: args.price || 0,
      enrolled: 0,
      room: args.room || "",
      startDate: args.startDate || "",
      endDate: args.endDate || "",
    });
    await s.save();
    return { success: true, message: `Clase "${args.name}" creada con ${args.teacher}` };
  }

  if (name === "update_class") {
    const cls = s.classes.find((c: any) => c.name === args.name);
    if (!cls) return { error: `Clase "${args.name}" no encontrada` };
    if (args.newName) cls.name = args.newName;
    if (args.teacher) cls.teacher = args.teacher;
    if (args.schedule) cls.schedule = args.schedule;
    if (args.capacity) cls.capacity = args.capacity;
    if (args.price !== undefined) cls.price = args.price;
    if (args.room) cls.room = args.room;
    await s.save();
    return { success: true, message: `Clase "${args.name}" actualizada` };
  }

  if (name === "delete_class") {
    const idx = s.classes.findIndex((c: any) => c.name === args.name);
    if (idx === -1) return { error: `Clase "${args.name}" no encontrada` };
    s.classes.splice(idx, 1);
    await s.save();
    return { success: true, message: `Clase "${args.name}" eliminada` };
  }

  if (name === "list_classes") {
    let classes = s.classes || [];
    if (args.teacher) classes = classes.filter((c: any) => c.teacher === args.teacher);
    classes = classes.slice(0, args.limit || 50);
    return {
      success: true,
      classes: classes.map((c: any) => ({
        id: c.id,
        name: c.name,
        teacher: c.teacher,
        schedule: c.schedule,
        capacity: c.capacity,
        enrolled: c.enrolled || 0,
        price: c.price,
        room: c.room,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
      count: classes.length,
    };
  }

  if (name === "enroll_student") {
    const cls = s.classes.find((c: any) => c.name === args.className);
    if (!cls) return { error: `Clase "${args.className}" no encontrada` };
    if (cls.capacity > 0 && (cls.enrolled || 0) >= cls.capacity) {
      return { error: `La clase "${args.className}" está llena (${cls.capacity} cupos)` };
    }
    cls.enrolled = (cls.enrolled || 0) + 1;
    await s.save();
    return { success: true, message: `${args.studentName} inscrito en "${args.className}"` };
  }

  return { error: `Unknown education tool: ${name}` };
}
