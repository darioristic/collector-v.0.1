import type {
	EnumTodoPriority,
	EnumTodoStatus,
} from "@/app/(protected)/apps/todo-list-app/enum";

export type TodoPriority = `${EnumTodoPriority}`;
export type TodoStatus = `${EnumTodoStatus}`;
export type FilterTab = "all" | TodoStatus;
export type ViewMode = "list" | "grid";

export interface Comment {
	id: string;
	text: string;
	createdAt: Date;
	author?: string;
	authorAvatar?: string;
}

export interface TodoFile {
	id: string;
	name: string;
	url: string;
	type: string;
	size: number;
	uploadedAt: Date;
}

export interface SubTask {
	id: string;
	title: string;
	completed: boolean;
	status?: TodoStatus;
	priority?: TodoPriority;
	description?: string;
}

export interface Todo {
	id: string;
	title: string;
	description?: string;
	assignedTo: string[];
	comments: Comment[];
	status: TodoStatus;
	priority: TodoPriority;
	createdAt: Date;
	dueDate?: Date | null;
	reminderDate?: Date | null;
	category?: string;
	createdBy?: string;
	files?: TodoFile[];
	subTasks?: SubTask[];
	starred: boolean;
}

export interface TodoPosition {
	id: string;
	position: number;
}
