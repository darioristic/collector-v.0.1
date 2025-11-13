"use client";

import { toast as sonnerToast } from "sonner";
import type * as React from "react";

/**
 * Geist-compatible useToasts hook
 * 
 * Provides a Geist Design System compatible API for toasts,
 * using Sonner under the hood.
 * 
 * Usage:
 * ```tsx
 * import { useToasts } from 'geist/components';
 * 
 * const toasts = useToasts();
 * 
 * // String format
 * toasts.success('Operation successful');
 * toasts.error('Something went wrong');
 * toasts.warning('Warning message');
 * toasts.info('Information message');
 * 
 * // Object format for message
 * toasts.message({
 *   text: 'The Evil Rabbit jumped over the fence.',
 *   duration: 5000,
 * });
 * ```
 */

type ToastMessage = string | React.ReactNode;
type ToastOptions = {
	duration?: number;
	description?: ToastMessage;
};

type MessageOptions = 
	| ToastMessage 
	| {
			text: ToastMessage;
			duration?: number;
			description?: ToastMessage;
	  };

interface UseToastsReturn {
	success: (message: ToastMessage, options?: ToastOptions) => string | number;
	error: (message: ToastMessage, options?: ToastOptions) => string | number;
	warning: (message: ToastMessage, options?: ToastOptions) => string | number;
	info: (message: ToastMessage, options?: ToastOptions) => string | number;
	loading: (message: ToastMessage, options?: ToastOptions) => string | number;
	message: (options: MessageOptions) => string | number;
	promise: <T>(
		promise: Promise<T>,
		{
			loading,
			success,
			error,
		}: {
			loading: ToastMessage;
			success: ToastMessage | ((data: T) => ToastMessage);
			error: ToastMessage | ((error: unknown) => ToastMessage);
		},
	) => Promise<T>;
	dismiss: (toastId?: string | number) => void;
}

export function useToasts(): UseToastsReturn {
	return {
		success: (message: ToastMessage, options?: ToastOptions) => {
			return sonnerToast.success(message, {
				duration: options?.duration,
				description: options?.description,
			});
		},
		error: (message: ToastMessage, options?: ToastOptions) => {
			return sonnerToast.error(message, {
				duration: options?.duration,
				description: options?.description,
			});
		},
		warning: (message: ToastMessage, options?: ToastOptions) => {
			return sonnerToast.warning(message, {
				duration: options?.duration,
				description: options?.description,
			});
		},
		info: (message: ToastMessage, options?: ToastOptions) => {
			return sonnerToast.info(message, {
				duration: options?.duration,
				description: options?.description,
			});
		},
		loading: (message: ToastMessage, options?: ToastOptions) => {
			return sonnerToast.loading(message, {
				duration: options?.duration,
				description: options?.description,
			});
		},
		message: (options: MessageOptions) => {
			// Support both object format: { text: '...' } and string/ReactNode format
			if (
				typeof options === "string" ||
				(typeof options === "object" &&
					options !== null &&
					!("text" in options))
			) {
				// String or ReactNode format
				return sonnerToast.message(options as ToastMessage);
			}
			// Object format: { text: '...', duration?: number, description?: string }
			const messageOptions = options as {
				text: ToastMessage;
				duration?: number;
				description?: ToastMessage;
			};
			return sonnerToast.message(messageOptions.text, {
				duration: messageOptions.duration,
				description: messageOptions.description,
			});
		},
		promise: <T,>(
			promise: Promise<T>,
			{
				loading,
				success,
				error,
			}: {
				loading: ToastMessage;
				success: ToastMessage | ((data: T) => ToastMessage);
				error: ToastMessage | ((error: unknown) => ToastMessage);
			},
		) => {
			return sonnerToast.promise(promise, {
				loading,
				success,
				error,
			});
		},
		dismiss: (toastId?: string | number) => {
			if (toastId !== undefined) {
				sonnerToast.dismiss(toastId);
			} else {
				sonnerToast.dismiss();
			}
		},
	};
}

