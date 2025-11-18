"use client";

import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { Spinner } from "./spinner";

export interface SubmitButtonProps extends ButtonProps {
  isSubmitting?: boolean;
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ children, isSubmitting, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        type="submit"
        disabled={disabled || isSubmitting}
        {...props}
      >
        {isSubmitting ? <Spinner /> : children}
      </Button>
    );
  }
);

SubmitButton.displayName = "SubmitButton";

export { SubmitButton };
