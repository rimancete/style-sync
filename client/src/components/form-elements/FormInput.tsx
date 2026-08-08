import { type Control, type FieldValues, type Path } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { Input, type InputProps } from '~/components/ui/input';

type FormInputProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
} & Omit<InputProps, 'name' | 'required' | 'onChange'>;

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  required = false,
  onChange: onChangeCallback,
  onKeyDown,
  ...inputProps
}: FormInputProps<T>) {
  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              aria-required={required}
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
