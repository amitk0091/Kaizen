import { requireUserId } from '@/lib/apiAuth';
import { requireWriteAccess } from '@/lib/entitlement';
import { dbConnect } from '@/lib/db';
import Todo from '@/models/Todo';
import { jsonResponse, errorResponse, badRequest } from '@/lib/apiErrors';

const VALID_STATUSES = ['pending', 'ongoing', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const MAX_TITLE_LENGTH = 200;
const MAX_NOTES_LENGTH = 1000;

export async function GET() {
  try {
    const { userId, error } = await requireUserId();
    if (error) return error;

    await dbConnect();
    const todos = await Todo.find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return jsonResponse({ todos });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req) {
  try {
    const { userId, error } = await requireUserId();
    if (error) return error;

    const gate = await requireWriteAccess(userId);
    if (gate.error) return gate.error;

    const body = await req.json();
    const { title, notes, status, priority, deadline, goalId } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw badRequest('Title is required');
    }

    const trimmedTitle = title.trim().slice(0, MAX_TITLE_LENGTH);
    const trimmedNotes = (notes || '').toString().trim().slice(0, MAX_NOTES_LENGTH);
    const validStatus = VALID_STATUSES.includes(status) ? status : 'pending';
    const validPriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';

    let deadlineDate = null;
    if (deadline) {
      deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw badRequest('Invalid deadline date');
      }
    }

    await dbConnect();
    const todo = await Todo.create({
      userId,
      title: trimmedTitle,
      notes: trimmedNotes,
      status: validStatus,
      priority: validPriority,
      deadline: deadlineDate,
      goalId: goalId || null,
    });

    return jsonResponse({ todo }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
