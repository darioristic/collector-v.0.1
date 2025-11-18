import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";
import type {
	CompanyResponse,
	CompanyUpsertPayload,
} from "@/lib/validations/settings/company";
import { fetchCompany, updateCompany } from "./api";

export function useCompanySettings() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const {
		data: company,
		isLoading,
		error,
	} = useQuery<CompanyResponse>({
		queryKey: ["company"],
		queryFn: fetchCompany,
	});

	const updateMutation = useMutation({
		mutationFn: (values: CompanyUpsertPayload) => updateCompany(values),
		onSuccess: (data) => {
			queryClient.setQueryData(["company"], data);
			toast({
				title: "Successfully saved",
				description: "Company settings have been successfully saved.",
			});
		},
		onError: (error: Error) => {
			toast({
				title: "Error",
				description: error.message || "Failed to save company settings.",
				variant: "destructive",
			});
		},
	});

	return {
		company,
		isLoading,
		error,
		updateCompany: updateMutation.mutateAsync,
		isUpdating: updateMutation.isPending,
	};
}
