"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createEmployee } from "../api";
import {
  addEmployeeFormSchema,
  departmentValues,
  type AddEmployeeFormInput,
  transformAddEmployeeToAPI
} from "../schemas/add-employee";

const DEFAULT_TAGS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "DevOps",
  "Design",
  "Product",
  "Marketing",
  "Sales",
  "Analytics",
  "Leadership",
  "Communication",
  "Problem Solving"
];

interface AddEmployeeDialogProps {
  children?: React.ReactNode;
}

export default function AddEmployeeDialog({ children }: AddEmployeeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddEmployeeFormInput>({
    resolver: zodResolver(addEmployeeFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      department: "Engineering",
      role: "",
      employmentType: "Full-time",
      status: "Active",
      startDate: "",
      profileImage: null,
      accessLevel: "User",
      tags: [],
      notes: ""
    }
  });

  const [tagsOpen, setTagsOpen] = React.useState(false);
  const [fileUploadState, fileUploadActions] = useFileUpload({
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: "image/*",
    multiple: false
  });

  React.useEffect(() => {
    if (fileUploadState.files.length > 0) {
      const file = fileUploadState.files[0]?.file;
      if (file instanceof File) {
        form.setValue("profileImage", file, { shouldValidate: true });
      }
    } else {
      form.setValue("profileImage", null, { shouldValidate: true });
    }
  }, [fileUploadState.files, form]);

  const onSubmit = async (values: AddEmployeeFormInput) => {
    try {
      const parsed = addEmployeeFormSchema.parse(values);
      const apiPayload = transformAddEmployeeToAPI(parsed);

      await createEmployee(apiPayload);

      // TODO: Integrate with Chat, Projects, CRM APIs once available
      // This should be done asynchronously after employee creation
      // Example:
      // await Promise.all([
      //   registerEmployeeInChat(apiPayload.email),
      //   registerEmployeeInProjects(apiPayload),
      //   registerEmployeeInCRM(apiPayload),
      // ]);

      queryClient.invalidateQueries({ queryKey: ["employees"] });

      toast({
        title: "Employee added successfully",
        description: "Employee added and synced across company systems"
      });

      form.reset();
      fileUploadActions.clearFiles();
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add employee. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };

  const normalizeDateValue = (value: string | Date | null | undefined) => {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return "";
      }
      return value.toISOString().split("T")[0] ?? "";
    }
    if (typeof value === "string") {
      return value;
    }
    return "";
  };

  const profileImagePreview = fileUploadState.files[0]?.preview;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Add a new team member to your organization. They will be automatically available across
            all company systems.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image Upload */}
            <FormField
              control={form.control}
              name="profileImage"
              render={() => (
                <FormItem>
                  <FormLabel>Profile Image</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        {profileImagePreview ? (
                          <AvatarImage src={profileImagePreview} alt="Profile preview" />
                        ) : null}
                        <AvatarFallback className="text-lg">
                          {form
                            .watch("fullName")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "EM"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          {...fileUploadActions.getInputProps({
                            onChange: (e) => {
                              fileUploadActions.handleFileChange(e);
                            }
                          })}
                        />
                        {fileUploadState.errors.length > 0 && (
                          <p className="text-destructive text-sm">{fileUploadState.errors[0]}</p>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Department */}
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentValues.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role / Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Employment Type - Radio Group */}
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Employment Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-row gap-6">
                      <FormItem className="flex items-center space-y-0 space-x-2">
                        <FormControl>
                          <RadioGroupItem value="Full-time" />
                        </FormControl>
                        <FormLabel className="font-normal">Full-time</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-y-0 space-x-2">
                        <FormControl>
                          <RadioGroupItem value="Part-time" />
                        </FormControl>
                        <FormLabel className="font-normal">Part-time</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-y-0 space-x-2">
                        <FormControl>
                          <RadioGroupItem value="Contractor" />
                        </FormControl>
                        <FormLabel className="font-normal">Contractor</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Access Level */}
              <FormField
                control={form.control}
                name="accessLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Level</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="User">User</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={normalizeDateValue(field.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags - Multi-select */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tags</FormLabel>
                  <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value?.length && "text-muted-foreground"
                          )}>
                          {field.value?.length
                            ? `${field.value.length} tag(s) selected`
                            : "Select tags..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandList>
                          <CommandEmpty>No tags found.</CommandEmpty>
                          <CommandGroup>
                            {DEFAULT_TAGS.map((tag) => {
                              const isSelected = field.value?.includes(tag);
                              return (
                                <CommandItem
                                  key={tag}
                                  value={tag}
                                  onSelect={() => {
                                    const currentTags = field.value || [];
                                    const newTags = isSelected
                                      ? currentTags.filter((t) => t !== tag)
                                      : [...currentTags, tag];
                                    field.onChange(newTags);
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {tag}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {field.value && field.value.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.value.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = field.value?.filter((t) => t !== tag);
                              field.onChange(newTags);
                            }}
                            className="focus:ring-ring ml-1 rounded-full outline-none focus:ring-2">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the employee..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Employee"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
