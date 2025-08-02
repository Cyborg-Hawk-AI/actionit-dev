
import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

type CheckboxGroupContextValue = {
  value?: string[];
  onValueChange?: (value: string[]) => void;
};

const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue>({});

export interface CheckboxGroupProps {
  /** The controlled value of the checkbox items to check */
  value?: string[];
  /** Event handler called when the value changes */
  onValueChange?: (value: string[]) => void;
  /** The checkbox items to render */
  children?: React.ReactNode;
  /** Class name to apply to the checkbox group */
  className?: string;
}

const CheckboxGroup = React.forwardRef<
  HTMLDivElement,
  CheckboxGroupProps
>(({ value, onValueChange, children, className, ...props }, ref) => {
  return (
    <CheckboxGroupContext.Provider value={{ value, onValueChange }}>
      <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
        {children}
      </div>
    </CheckboxGroupContext.Provider>
  );
});
CheckboxGroup.displayName = "CheckboxGroup";

export interface CheckboxItemProps {
  /** The value of the checkbox item */
  value: string;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** The id of the checkbox item */
  id?: string;
  /** Class name to apply to the checkbox item */
  className?: string;
}

const CheckboxItem = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  CheckboxItemProps
>(({ value, disabled, id, className, ...props }, ref) => {
  const context = React.useContext(CheckboxGroupContext);
  const checked = context.value?.includes(value) || false;
  
  return (
    <Checkbox
      ref={ref}
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(checked) => {
        if (!context.onValueChange) return;
        
        if (checked) {
          context.onValueChange([...(context.value || []), value]);
        } else {
          context.onValueChange(
            (context.value || []).filter((item) => item !== value)
          );
        }
      }}
      className={className}
      {...props}
    />
  );
});
CheckboxItem.displayName = "CheckboxItem";

export { CheckboxGroup, CheckboxItem };
