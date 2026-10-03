import { type ReactNode } from 'react';
import { type Control, type FieldValues, type Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { Input, type InputProps } from '~/components/ui/input';
import { cn } from '~/lib/utils';

type FormInputProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  endIcon?: ReactNode;
} & Omit<InputProps, 'name' | 'required' | 'onChange'>;

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  onChange: onChangeCallback,
  onKeyDown,
  endIcon,
  className,
  ...inputProps
}: FormInputProps<T>) {
  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem>
          <FormLabel required={required}>{label}</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                placeholder={placeholder}
                aria-required={required}
                className={cn(endIcon ? 'pr-10' : undefined, className)}
                {...field}
                {...inputProps}
                onChange={(event) => {
                  const { value } = event.target;
                  field.onChange(value);
                  onChangeCallback?.(value);
                }}
                onKeyDown={onKeyDown}
              />
            </FormControl>
            {endIcon ? (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">{endIcon}</div>
            ) : null}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
