"use client";

import { format, parseISO } from "date-fns";
import {
	Bell,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CornerDownRight,
	FileText,
	Flag,
	MessageCircle,
	MoreVertical,
	Paperclip,
	Plus,
	Send,
	X,
} from "lucide-react";
import React, { useId } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProjectTask, TaskStatus } from "@/src/types/projects";

interface ProjectTaskDetailSheetProps {
	isOpen: boolean;
	onClose: () => void;
	task: ProjectTask | null;
	allTasks: ProjectTask[];
	onStatusChange: (task: ProjectTask, status: TaskStatus) => void;
	onDelete: (task: ProjectTask) => void;
	onTaskSelect?: (taskId: string) => void;
}

const statusConfig: Record<
	TaskStatus,
	{
		label: string;
		badgeClass: string;
	}
> = {
	todo: {
		label: "Za uraditi",
		badgeClass: "bg-muted text-muted-foreground",
	},
	in_progress: {
		label: "U toku",
		badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
	},
	blocked: {
		label: "Blokirano",
		badgeClass: "bg-red-500/15 text-red-600 dark:text-red-300",
	},
	done: {
		label: "Završeno",
		badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
	},
};

const ProjectTaskDetailSheet: React.FC<ProjectTaskDetailSheetProps> = ({
	isOpen,
	onClose,
	task,
	allTasks,
	onStatusChange,
	onDelete,
	onTaskSelect,
}) => {
	const subtaskTitleId = useId();
	const subtaskDescriptionId = useId();
	const subtaskStatusId = useId();
	const subtaskPriorityId = useId();
	const [newComment, setNewComment] = React.useState("");
	const [isDescriptionExpanded, setIsDescriptionExpanded] =
		React.useState(false);
	const [isAddSubtaskOpen, setIsAddSubtaskOpen] = React.useState(false);
	const [subtasks, setSubtasks] = React.useState<
		Array<{
			id: string;
			title: string;
			status: "todo" | "doing" | "done";
			priority: "low" | "medium" | "high";
			description: string;
		}>
	>([
		{
			id: "1",
			title: "Review Curriculum Requirements",
			status: "doing",
			priority: "low",
			description:
				"Review the curriculum standards and learning objectives that must be achieved.",
		},
	]);
	const [newSubtask, setNewSubtask] = React.useState({
		title: "",
		description: "",
		status: "todo" as "todo" | "doing" | "done",
		priority: "low" as "low" | "medium" | "high",
	});
	const [comments] = React.useState<
		Array<{
			id: string;
			author: string;
			avatar: string;
			avatarColor: string;
			timestamp: string;
			text: string;
		}>
	>([
		{
			id: "1",
			author: "Lydia Workman",
			avatar: "L",
			avatarColor: "bg-green-500",
			timestamp: "14 April 2025 at 12:15PM",
			text: "Candidate presents herself professionally with a clear passion for employee development. Articulate, confident, and well-prepared for the interview.",
		},
		{
			id: "2",
			author: "Ahmad Zainy",
			avatar: "A",
			avatarColor: "bg-blue-500",
			timestamp: "14 April 2025 at 11:25PM",
			text: "Strong technical background and excellent communication skills. Would be a great addition to the team.",
		},
	]);

	if (!task) return null;

	const currentIndex = allTasks.findIndex((t) => t.id === task.id);
	const totalTasks = allTasks.length;
	const hasPrevious = currentIndex > 0;
	const hasNext = currentIndex < totalTasks - 1;

	const handlePrevious = () => {
		if (hasPrevious && currentIndex > 0 && onTaskSelect) {
			const previousTask = allTasks[currentIndex - 1];
			onTaskSelect(previousTask.id);
		}
	};

	const handleNext = () => {
		if (hasNext && currentIndex < totalTasks - 1 && onTaskSelect) {
			const nextTask = allTasks[currentIndex + 1];
			onTaskSelect(nextTask.id);
		}
	};

	const handleStatusChange = (value: TaskStatus) => {
		onStatusChange(task, value);
		toast.success(`Status promenjen na ${statusConfig[value].label}`);
	};

	const handleAddComment = () => {
		if (!newComment.trim()) {
			toast.error("Tekst komentara je obavezan");
			return;
		}
		// TODO: Implement add comment functionality
		setNewComment("");
		toast.success("Komentar je dodat.");
	};

	const handleAddSubtask = () => {
		if (!newSubtask.title.trim()) {
			toast.error("Naslov podtaskova je obavezan");
			return;
		}
		const subtask = {
			id: Date.now().toString(),
			...newSubtask,
		};
		setSubtasks([...subtasks, subtask]);
		setNewSubtask({
			title: "",
			description: "",
			status: "todo",
			priority: "low",
		});
		setIsAddSubtaskOpen(false);
		toast.success("Podtask je dodat.");
	};

	const getInitials = (name?: string | null, email?: string | null) => {
		const value = name || email || "?";
		return value
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getAvatarColor = (name?: string | null, email?: string | null) => {
		const value = name || email || "?";
		const colors = [
			"bg-blue-500",
			"bg-green-500",
			"bg-yellow-500",
			"bg-purple-500",
			"bg-pink-500",
			"bg-red-500",
			"bg-indigo-500",
		];
		const index = value.charCodeAt(0) % colors.length;
		return colors[index];
	};

	const descriptionLength = task.description?.length || 0;
	const shouldTruncate = descriptionLength > 200;
	const displayDescription = isDescriptionExpanded
		? task.description
		: task.description?.substring(0, 200);

	const status = statusConfig[task.status];
	const assignee = task.assignee;

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden p-0 [&>button]:hidden">
				<SheetHeader className="sr-only">
					<SheetTitle>Task Detail</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col h-full">
					{/* Header with navigation */}
					<div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
						<h2 className="text-lg font-semibold">Task Detail</h2>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={handlePrevious}
								disabled={!hasPrevious}
								className="h-8 w-8 rounded-full"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleNext}
								disabled={!hasNext}
								className="h-8 w-8 rounded-full"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
							<span className="text-sm text-muted-foreground min-w-[70px] text-center px-2 shrink-0">
								{String(currentIndex + 1).padStart(2, "0")} of {totalTasks}
							</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={onClose}
								className="h-8 w-8 rounded-full"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto px-6">
						{/* Task Title with actions */}
						<div className="pt-6 pb-4">
							<div className="flex items-start justify-between gap-4 mb-6">
								<h1 className="text-3xl font-bold flex-1 leading-tight">
									{task.title}
								</h1>
								<div className="flex items-center gap-2 shrink-0">
									<Button
										variant="outline"
										size="icon"
										className="h-9 w-9 rounded-lg relative"
									>
										<Bell className="h-4 w-4" />
										<Plus className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5" />
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												size="icon"
												className="h-9 w-9 rounded-lg"
											>
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												className="text-destructive focus:text-destructive"
												onClick={() => {
													onDelete(task);
													onClose();
												}}
											>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>

							{/* Details Section */}
							<div className="space-y-5">
								{/* Status */}
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium min-w-[100px]">
										Status
									</span>
									<Select
										value={task.status}
										onValueChange={handleStatusChange}
									>
										<SelectTrigger className="w-fit h-auto px-2 py-1">
											<SelectValue>
												<Badge className={status.badgeClass}>
													{status.label}
												</Badge>
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{Object.entries(statusConfig).map(([value, config]) => (
												<SelectItem key={value} value={value}>
													{config.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Assignee */}
								{assignee && (
									<div className="flex items-center gap-4">
										<span className="text-sm font-medium min-w-[100px]">
											Assignee
										</span>
										<div className="flex items-center gap-2">
											<Avatar
												className={cn(
													"h-8 w-8",
													getAvatarColor(assignee.name, assignee.email),
												)}
											>
												<AvatarFallback className="text-xs">
													{getInitials(assignee.name, assignee.email)}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm">
												{assignee.name || assignee.email || "Nije dodeljeno"}
											</span>
										</div>
									</div>
								)}

								{/* Date & Time */}
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium min-w-[100px]">
										Date & Time
									</span>
									<span className="text-sm text-muted-foreground">
										{format(
											parseISO(task.createdAt),
											"d MMMM yyyy 'at' h:mm a",
										)}
									</span>
								</div>

								{/* Due Date */}
								{task.dueDate && (
									<div className="flex items-center gap-4">
										<span className="text-sm font-medium min-w-[100px]">
											Due Date
										</span>
										<span className="text-sm text-muted-foreground">
											{format(parseISO(task.dueDate), "d MMMM yyyy")}
										</span>
									</div>
								)}

								{/* Description */}
								<div className="flex items-start gap-4">
									<span className="text-sm font-medium min-w-[100px]">
										Description
									</span>
									<div className="flex-1">
										<p className="text-sm text-muted-foreground">
											{displayDescription || "No description provided."}
											{shouldTruncate && !isDescriptionExpanded && "..."}
										</p>
										{shouldTruncate && (
											<button
												type="button"
												onClick={() =>
													setIsDescriptionExpanded(!isDescriptionExpanded)
												}
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

						{/* Subtasks Section */}
						<div className="pb-6">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<FileText className="h-4 w-4" />
									<h3 className="text-sm font-medium">Sub Task</h3>
									<div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs font-medium">
										{subtasks.length}
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="gap-2"
									onClick={() => setIsAddSubtaskOpen(true)}
								>
									<Plus className="h-4 w-4" />
									Add Subtask
								</Button>
							</div>

							<div className="space-y-3">
								{subtasks.map((subtask) => (
									<Card
										key={subtask.id}
										className="border-l-4 border-l-purple-500 rounded-lg"
									>
										<div className="p-4">
											<div className="flex items-start justify-between mb-3">
												<h4 className="text-base font-semibold flex-1">
													{subtask.title}
												</h4>
												<div className="flex items-center gap-2 shrink-0">
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7"
													>
														<Bell className="h-3.5 w-3.5" />
													</Button>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7"
															>
																<MoreVertical className="h-3.5 w-3.5" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem>Edit</DropdownMenuItem>
															<DropdownMenuItem className="text-destructive">
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>

											<div className="flex items-center gap-2 mb-3">
												<Select
													value={subtask.status}
													onValueChange={(_value) => {
														// TODO: Handle status change
													}}
												>
													<SelectTrigger className="w-fit h-7 px-3 text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
														<SelectValue>
															<div className="flex items-center gap-1.5">
																<div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
																<span className="capitalize">
																	{subtask.status}
																</span>
																<ChevronDown className="h-3 w-3" />
															</div>
														</SelectValue>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="todo">Todo</SelectItem>
														<SelectItem value="doing">Doing</SelectItem>
														<SelectItem value="done">Done</SelectItem>
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<div className="flex items-center gap-3">
													<div className="flex items-center gap-1.5 min-w-[80px]">
														<Flag className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="text-xs text-muted-foreground">
															Priority
														</span>
													</div>
													<Badge
														variant="outline"
														className={cn(
															"text-xs border-green-200 bg-green-50 text-green-700",
															subtask.priority === "medium" &&
																"border-yellow-200 bg-yellow-50 text-yellow-700",
															subtask.priority === "high" &&
																"border-red-200 bg-red-50 text-red-700",
														)}
													>
														<Flag className="h-3 w-3 mr-1" />
														<span className="capitalize">
															{subtask.priority}
														</span>
													</Badge>
												</div>

												<div className="flex items-start gap-3">
													<div className="flex items-center gap-1.5 min-w-[80px]">
														<FileText className="h-3.5 w-3.5 text-muted-foreground" />
														<span className="text-xs text-muted-foreground">
															Description
														</span>
													</div>
													<p className="text-xs text-muted-foreground flex-1">
														{subtask.description}
													</p>
												</div>
											</div>
										</div>
									</Card>
								))}
							</div>
						</div>

						<Separator className="my-6" />

						{/* Comments Section */}
						<div className="pb-6">
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
										className="pr-16"
									/>
									<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
										<Button variant="ghost" size="icon" className="h-6 w-6">
											<Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={handleAddComment}
											disabled={!newComment.trim()}
										>
											<Send className="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
									</div>
								</div>
							</div>

							{/* Comments List */}
							<div className="space-y-4">
								{comments.map((comment) => (
									<div key={comment.id} className="flex gap-3">
										<Avatar className={cn("h-8 w-8", comment.avatarColor)}>
											<AvatarFallback className="text-white text-xs font-semibold">
												{comment.avatar}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 space-y-1">
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<span className="text-sm font-semibold">
															{comment.author}
														</span>
														<span className="text-xs text-muted-foreground">
															{comment.timestamp}
														</span>
													</div>
													<p className="text-sm text-foreground mt-1">
														{comment.text}
													</p>
													<button
														type="button"
														className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
													>
														<CornerDownRight className="h-3.5 w-3.5" />
														<span>Reply</span>
													</button>
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 shrink-0"
												>
													<MoreVertical className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</SheetContent>

			{/* Add Subtask Dialog */}
			<Dialog open={isAddSubtaskOpen} onOpenChange={setIsAddSubtaskOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Add Subtask</DialogTitle>
						<DialogDescription>
							Add a new subtask to this task. Fill in the details below.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor={subtaskTitleId}>Title *</Label>
							<Input
								id={subtaskTitleId}
								placeholder="Enter subtask title"
								value={newSubtask.title}
								onChange={(e) =>
									setNewSubtask({ ...newSubtask, title: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={subtaskDescriptionId}>Description</Label>
							<Textarea
								id={subtaskDescriptionId}
								placeholder="Enter subtask description"
								value={newSubtask.description}
								onChange={(e) =>
									setNewSubtask({ ...newSubtask, description: e.target.value })
								}
								rows={3}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor={subtaskStatusId}>Status</Label>
								<Select
									value={newSubtask.status}
									onValueChange={(value: "todo" | "doing" | "done") =>
										setNewSubtask({ ...newSubtask, status: value })
									}
								>
									<SelectTrigger id={subtaskStatusId}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="todo">Todo</SelectItem>
										<SelectItem value="doing">Doing</SelectItem>
										<SelectItem value="done">Done</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor={subtaskPriorityId}>Priority</Label>
								<Select
									value={newSubtask.priority}
									onValueChange={(value: "low" | "medium" | "high") =>
										setNewSubtask({ ...newSubtask, priority: value })
									}
								>
									<SelectTrigger id={subtaskPriorityId}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="low">Low</SelectItem>
										<SelectItem value="medium">Medium</SelectItem>
										<SelectItem value="high">High</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsAddSubtaskOpen(false);
								setNewSubtask({
									title: "",
									description: "",
									status: "todo",
									priority: "low",
								});
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleAddSubtask}
							disabled={!newSubtask.title.trim()}
						>
							Add Subtask
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Sheet>
	);
};

export default ProjectTaskDetailSheet;
