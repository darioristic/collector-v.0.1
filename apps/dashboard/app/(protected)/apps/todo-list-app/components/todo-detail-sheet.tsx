"use client";

import { format } from "date-fns";
import {
	ArrowRight,
	Bell,
	ChevronLeft,
	ChevronRight,
	Folder,
	MessageCircle,
	Mic,
	MoreVertical,
	Paperclip,
	Send,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import {
	EnumTodoPriority,
	EnumTodoStatus,
	statusClasses,
	todoStatusNamed,
} from "@/app/(protected)/apps/todo-list-app/enum";
import { useTodoStore } from "@/app/(protected)/apps/todo-list-app/store";
import type { TodoStatus, TodoPriority } from "@/app/(protected)/apps/todo-list-app/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TodoDetailSheetProps {
	isOpen: boolean;
	onClose: () => void;
	todoId: string | null;
	onEditClick?: (id: string) => void;
}

const TodoDetailSheet: React.FC<TodoDetailSheetProps> = ({
	isOpen,
	onClose,
	todoId,
	onEditClick,
}) => {
	const {
		todos,
		addComment,
		deleteComment,
		updateTodo,
		addSubTask,
		updateSubTask,
		removeSubTask,
		setSelectedTodoId,
		setTodoSheetOpen,
	} = useTodoStore();

	const [newComment, setNewComment] = React.useState("");
	const [newSubTask, setNewSubTask] = React.useState("");
	const [isAddingSubTask, setIsAddingSubTask] = React.useState(false);
	const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

	const todo = todos.find((t) => t.id === todoId);
	const currentIndex = todoId ? todos.findIndex((t) => t.id === todoId) : -1;
	const totalTodos = todos.length;
	const hasPrevious = currentIndex > 0;
	const hasNext = currentIndex < totalTodos - 1;

	if (!todo) return null;

	const handlePrevious = () => {
		if (hasPrevious && currentIndex > 0) {
			const previousTodo = todos[currentIndex - 1];
			setSelectedTodoId(previousTodo.id);
			setTodoSheetOpen(true);
		}
	};

	const handleNext = () => {
		if (hasNext && currentIndex < totalTodos - 1) {
			const nextTodo = todos[currentIndex + 1];
			setSelectedTodoId(nextTodo.id);
			setTodoSheetOpen(true);
		}
	};

	const handleStatusChange = (value: TodoStatus) => {
		updateTodo(todo.id, { status: value });
		toast.success(`Status changed to ${todoStatusNamed[value]}`);
	};

	const handlePriorityChange = (value: TodoPriority) => {
		updateTodo(todo.id, { priority: value });
		toast.success(`Priority changed to ${value}`);
	};

	const handleAddComment = () => {
		if (!newComment.trim()) {
			toast.error("Comment text is required");
			return;
		}

		addComment(todo.id, newComment);
		setNewComment("");
		toast.success("Your comment has been added successfully.");
	};

	const handleAddSubTask = () => {
		if (!newSubTask.trim()) {
			toast.error("Subtask title is required");
			return;
		}

		addSubTask(todo.id, newSubTask);
		setNewSubTask("");
		setIsAddingSubTask(false);
		toast.success("Your subtask has been added successfully.");
	};

	const handleSubTaskStatusChange = (subTaskId: string, status: TodoStatus) => {
		const subTask = todo.subTasks?.find((st) => st.id === subTaskId);
		if (subTask) {
			updateTodo(todo.id, {
				subTasks: (todo.subTasks || []).map((st) =>
					st.id === subTaskId ? { ...st, status } : st,
				),
			});
		}
	};

	const handleSubTaskPriorityChange = (subTaskId: string, priority: TodoPriority) => {
		const subTask = todo.subTasks?.find((st) => st.id === subTaskId);
		if (subTask) {
			updateTodo(todo.id, {
				subTasks: (todo.subTasks || []).map((st) =>
					st.id === subTaskId ? { ...st, priority } : st,
				),
			});
		}
	};

	const getInitials = (name?: string) => {
		if (!name) return "?";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getAvatarColor = (name?: string) => {
		if (!name) return "bg-gray-500";
		const colors = [
			"bg-blue-500",
			"bg-green-500",
			"bg-yellow-500",
			"bg-purple-500",
			"bg-pink-500",
			"bg-red-500",
			"bg-indigo-500",
		];
		const index = name.charCodeAt(0) % colors.length;
		return colors[index];
	};

	const descriptionLength = todo.description?.length || 0;
	const shouldTruncate = descriptionLength > 200;
	const displayDescription = isDescriptionExpanded
		? todo.description
		: todo.description?.substring(0, 200);

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
				<SheetHeader className="p-0 mb-6">
					<SheetTitle className="sr-only">Task Detail</SheetTitle>
				</SheetHeader>
				{/* Header with navigation */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-4">
						<h2 className="text-lg font-semibold">Task Detail</h2>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={handlePrevious}
								disabled={!hasPrevious}
								className="h-8 w-8"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-sm text-muted-foreground min-w-[60px] text-center">
								{String(currentIndex + 1).padStart(2, "0")} of {totalTodos}
							</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleNext}
								disabled={!hasNext}
								className="h-8 w-8"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Task Title with actions */}
				<div className="mb-6">
					<div className="flex items-start justify-between gap-4 mb-4">
						<h1 className="text-2xl font-bold flex-1">{todo.title}</h1>
						<div className="flex items-center gap-2">
							{todo.reminderDate && (
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<Bell className="h-4 w-4" />
								</Button>
							)}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{onEditClick && (
										<DropdownMenuItem onClick={() => onEditClick(todo.id)}>
											Edit
										</DropdownMenuItem>
									)}
									<DropdownMenuItem variant="destructive">
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					{/* Details Section */}
					<div className="space-y-4">
						{/* Status */}
						<div className="flex items-center gap-4">
							<label className="text-sm font-medium min-w-[100px]">Status</label>
							<Select value={todo.status} onValueChange={handleStatusChange}>
								<SelectTrigger className="w-fit h-auto px-2 py-1">
									<SelectValue>
										<Badge className={statusClasses[todo.status]}>
											{todoStatusNamed[todo.status]}
										</Badge>
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{Object.values(EnumTodoStatus).map((status) => (
										<SelectItem key={status} value={status}>
											{todoStatusNamed[status]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Created by */}
						{todo.createdBy && (
							<div className="flex items-center gap-4">
								<label className="text-sm font-medium min-w-[100px]">
									Created by
								</label>
								<div className="flex items-center gap-2">
									<Avatar className={cn("h-8 w-8", getAvatarColor(todo.createdBy))}>
										<AvatarFallback className="text-xs">
											{getInitials(todo.createdBy)}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm">{todo.createdBy}</span>
								</div>
							</div>
						)}

						{/* Date & Time */}
						<div className="flex items-center gap-4">
							<label className="text-sm font-medium min-w-[100px]">
								Date & Time
							</label>
							<span className="text-sm text-muted-foreground">
								{format(new Date(todo.createdAt), "d MMMM yyyy 'at' h:mm a")}
							</span>
						</div>

						{/* Category */}
						{todo.category && (
							<div className="flex items-center gap-4">
								<label className="text-sm font-medium min-w-[100px]">
									Category
								</label>
								<span className="text-sm">{todo.category}</span>
							</div>
						)}

						{/* Priority */}
						<div className="flex items-center gap-4">
							<label className="text-sm font-medium min-w-[100px]">Priority</label>
							<Select value={todo.priority} onValueChange={handlePriorityChange}>
								<SelectTrigger className="w-fit">
									<SelectValue>
										<div className="flex items-center gap-2">
											<span
												className={cn(
													"h-2 w-2 rounded-full",
													todo.priority === "high"
														? "bg-red-500"
														: todo.priority === "medium"
															? "bg-yellow-500"
															: "bg-gray-400",
												)}
											/>
											<span className="capitalize">{todo.priority}</span>
										</div>
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{Object.values(EnumTodoPriority).map((priority) => (
										<SelectItem key={priority} value={priority}>
											<div className="flex items-center gap-2">
												<span
													className={cn(
														"h-2 w-2 rounded-full",
														priority === "high"
															? "bg-red-500"
															: priority === "medium"
																? "bg-yellow-500"
																: "bg-gray-400",
													)}
												/>
												<span className="capitalize">{priority}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Reminder */}
						{todo.reminderDate && (
							<div className="flex items-center gap-4">
								<label className="text-sm font-medium min-w-[100px]">
									Reminder
								</label>
								<span className="text-sm text-muted-foreground">
									{format(
										new Date(todo.reminderDate),
										"d MMMM yyyy 'at' h:mm a",
									)}
								</span>
							</div>
						)}

						{/* Description */}
						<div className="flex items-start gap-4">
							<label className="text-sm font-medium min-w-[100px]">
								Description
							</label>
							<div className="flex-1">
								<p className="text-sm text-muted-foreground">
									{displayDescription || "No description provided."}
									{shouldTruncate && !isDescriptionExpanded && "..."}
								</p>
								{shouldTruncate && (
									<button
										onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
										className="text-sm text-blue-600 hover:underline mt-1"
									>
										{isDescriptionExpanded ? "Read less" : "Read more"}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				<Separator className="my-6" />

				{/* Sub Task Section */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Folder className="h-4 w-4" />
							<h3 className="text-sm font-medium">
								Sub Task {todo.subTasks?.length || 0}
							</h3>
						</div>
						{!isAddingSubTask && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsAddingSubTask(true)}
							>
								+ Add Subtask
							</Button>
						)}
					</div>

					{todo.subTasks && todo.subTasks.length > 0 ? (
						<div className="space-y-4">
							{todo.subTasks.map((subTask) => (
								<div
									key={subTask.id}
									className="border rounded-md p-4 space-y-3"
								>
									<div className="flex items-start justify-between">
										<h4 className="font-medium">{subTask.title}</h4>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon" className="h-6 w-6">
												<Bell className="h-3 w-3" />
											</Button>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon" className="h-6 w-6">
														<MoreVertical className="h-3 w-3" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														variant="destructive"
														onClick={() => removeSubTask(todo.id, subTask.id)}
													>
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<label className="text-xs font-medium min-w-[60px]">
											Priority
										</label>
										<Select
											value={subTask.priority || EnumTodoPriority.Low}
											onValueChange={(value) =>
												handleSubTaskPriorityChange(
													subTask.id,
													value as TodoPriority,
												)
											}
										>
											<SelectTrigger className="w-fit h-7">
												<SelectValue>
													<div className="flex items-center gap-1">
														<span
															className={cn(
																"h-2 w-2 rounded-full",
																(subTask.priority || EnumTodoPriority.Low) ===
																	"high"
																	? "bg-red-500"
																	: (subTask.priority || EnumTodoPriority.Low) ===
																			"medium"
																		? "bg-yellow-500"
																		: "bg-gray-400",
															)}
														/>
														<span className="text-xs capitalize">
															{subTask.priority || EnumTodoPriority.Low}
														</span>
													</div>
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{Object.values(EnumTodoPriority).map((priority) => (
													<SelectItem key={priority} value={priority}>
														<div className="flex items-center gap-2">
															<span
																className={cn(
																	"h-2 w-2 rounded-full",
																	priority === "high"
																		? "bg-red-500"
																		: priority === "medium"
																			? "bg-yellow-500"
																			: "bg-gray-400",
																)}
															/>
															<span className="capitalize">{priority}</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{subTask.description && (
										<div className="flex items-start gap-4">
											<label className="text-xs font-medium min-w-[60px]">
												Description
											</label>
											<p className="text-xs text-muted-foreground flex-1">
												{subTask.description}
											</p>
										</div>
									)}
									<div className="flex items-center gap-4">
										<label className="text-xs font-medium min-w-[60px]">
											Status
										</label>
										<Select
											value={subTask.status || EnumTodoStatus.Pending}
											onValueChange={(value) =>
												handleSubTaskStatusChange(
													subTask.id,
													value as TodoStatus,
												)
											}
										>
											<SelectTrigger className="w-fit h-7 px-2 py-1">
												<SelectValue>
													<Badge
														className={
															statusClasses[
																(subTask.status as EnumTodoStatus) ||
																	EnumTodoStatus.Pending
															]
														}
													>
														{
															todoStatusNamed[
																(subTask.status as EnumTodoStatus) ||
																	EnumTodoStatus.Pending
															]
														}
													</Badge>
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{Object.values(EnumTodoStatus).map((status) => (
													<SelectItem key={status} value={status}>
														{todoStatusNamed[status]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-sm text-muted-foreground text-center py-4">
							No subtasks yet.
						</div>
					)}

					{isAddingSubTask && (
						<div className="flex gap-2 mt-4">
							<Input
								value={newSubTask}
								onChange={(e) => setNewSubTask(e.target.value)}
								placeholder="Enter subtask title"
								className="flex-1"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleAddSubTask();
									} else if (e.key === "Escape") {
										setIsAddingSubTask(false);
										setNewSubTask("");
									}
								}}
								autoFocus
							/>
							<Button onClick={handleAddSubTask}>Add</Button>
							<Button
								variant="outline"
								onClick={() => {
									setIsAddingSubTask(false);
									setNewSubTask("");
								}}
							>
								Cancel
							</Button>
						</div>
					)}
				</div>

				<Separator className="my-6" />

				{/* Comments Section */}
				<div>
					<div className="flex items-center gap-2 mb-4">
						<MessageCircle className="h-4 w-4" />
						<h3 className="text-sm font-medium">Comments</h3>
					</div>

					{/* Comment Input */}
					<div className="mb-6">
						<div className="relative">
							<Input
								placeholder="Type comment"
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && e.ctrlKey) {
										handleAddComment();
									}
								}}
								className="pr-20"
							/>
							<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
								<Button variant="ghost" size="icon" className="h-6 w-6">
									<Mic className="h-3 w-3" />
								</Button>
								<Button variant="ghost" size="icon" className="h-6 w-6">
									<Paperclip className="h-3 w-3" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={handleAddComment}
									disabled={!newComment.trim()}
								>
									<Send className="h-3 w-3" />
								</Button>
							</div>
						</div>
					</div>

					{/* Comments List */}
					<div className="space-y-4">
						{todo.comments.length === 0 ? (
							<div className="text-sm text-muted-foreground text-center py-4">
								No comments yet.
							</div>
						) : (
							todo.comments.map((comment) => (
								<div key={comment.id} className="space-y-2">
									<div className="flex items-start gap-3">
										<Avatar
											className={cn(
												"h-8 w-8",
												getAvatarColor(comment.author),
											)}
										>
											<AvatarFallback className="text-xs">
												{getInitials(comment.author)}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 space-y-1">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium">
														{comment.author || "Anonymous"}
													</span>
													<span className="text-xs text-muted-foreground">
														{format(new Date(comment.createdAt), "d MMMM yyyy 'at' h:mm a")}
													</span>
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-6 w-6">
															<MoreVertical className="h-3 w-3" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															variant="destructive"
															onClick={() => deleteComment(todo.id, comment.id)}
														>
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
											<p className="text-sm text-muted-foreground">
												{comment.text}
											</p>
											<button className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
												Reply
												<ArrowRight className="h-3 w-3" />
											</button>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default TodoDetailSheet;
