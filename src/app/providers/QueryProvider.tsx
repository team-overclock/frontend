import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";



export interface QueryProviderProps {
	children: React.ReactNode;
}

/**
 * 앱 전역 QueryClient Provider.
 */
export function QueryProvider({ children }: QueryProviderProps) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				retry: 1,
			},
		},
	}));

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
