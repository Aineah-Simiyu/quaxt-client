'use client';

import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  options,
  description,
  className,
  ...props
}) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const error = errors[name];
  const value = watch(name);

  // Handle select field changes
  const handleSelectChange = (value) => {
    setValue(name, value, { shouldValidate: true });
  };

  // Handle checkbox field changes
  const handleCheckboxChange = (checked) => {
    setValue(name, checked, { shouldValidate: true });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={name} className="flex flex-col space-y-1">
          <span>{label}</span>
          {description && (
            <span className="text-xs font-normal text-muted-foreground">
              {description}
            </span>
          )}
        </Label>
      )}

      {type === 'textarea' ? (
        <Textarea
          id={name}
          {...register(name)}
          placeholder={placeholder}
          className={error ? 'border-destructive' : ''}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      ) : type === 'select' ? (
        <Select
          onValueChange={handleSelectChange}
          defaultValue={value || ''}
        >
          <SelectTrigger id={name} className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === 'checkbox' ? (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={name}
            checked={value || false}
            onCheckedChange={handleCheckboxChange}
            className={error ? 'border-destructive' : ''}
            {...props}
          />
          {placeholder && (
            <label
              htmlFor={name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {placeholder}
            </label>
          )}
        </div>
      ) : (
        <Input
          id={name}
          type={type}
          {...register(name)}
          placeholder={placeholder}
          className={error ? 'border-destructive' : ''}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      )}

      {error && (
        <p className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}